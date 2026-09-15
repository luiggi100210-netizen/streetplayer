const path         = require('path');
const fs           = require('fs');
const multer       = require('multer');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('../middleware/asyncHandler');

// Cloudinary en producción (almacenamiento persistente);
// disco local como fallback de desarrollo — en Render el disco es efímero.
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
const usaCloudinary = !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);

let cloudinary = null;
if (usaCloudinary) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key:    CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
} else {
  console.warn('[upload] Cloudinary no configurado — fotos en disco local (solo desarrollo)');
}

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!usaCloudinary && !fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const storage = usaCloudinary
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOADS_DIR),
      filename:    (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`),
    });

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    ALLOWED_MIME.includes(file.mimetype)
      ? cb(null, true)
      : cb(Object.assign(new Error('Solo se permiten imágenes JPEG, PNG o WebP'), { status: 400 }));
  },
}).single('foto');

const subirFoto = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

  // El mimetype anterior lo declara el cliente y es falsificable — se valida
  // el contenido real del archivo (magic bytes) antes de aceptarlo.
  const { fileTypeFromBuffer, fileTypeFromFile } = await import('file-type');
  const tipoReal = usaCloudinary
    ? await fileTypeFromBuffer(req.file.buffer)
    : await fileTypeFromFile(req.file.path);

  if (!tipoReal || !ALLOWED_MIME.includes(tipoReal.mime)) {
    if (!usaCloudinary) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'El contenido del archivo no es una imagen JPEG, PNG o WebP válida' });
  }

  if (!usaCloudinary) {
    return res.json({ url: `/uploads/${req.file.filename}` });
  }

  const resultado = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'streetplayer', resource_type: 'image' }, (err, result) =>
        err ? reject(err) : resolve(result)
      )
      .end(req.file.buffer);
  });

  res.json({ url: resultado.secure_url });
});

module.exports = { uploadMiddleware, subirFoto };
