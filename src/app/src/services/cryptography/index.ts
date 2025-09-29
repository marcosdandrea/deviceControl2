
import crypto from 'crypto';

const password = process.env.ENCRYPTION_PASSWORD || 'default_password';

// Función para derivar una clave desde la contraseña
const deriveKey = (password: string, salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
};

// Encriptar texto
export const encryptData = async (text: string): Promise<string> => {
  try {
    // Generar salt e IV aleatorios
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12); // 12 bytes para GCM
    
    // Derivar la clave desde la contraseña
    const key = deriveKey(password, salt);
    
    // Crear el cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from('DeviceControl2'));
    
    // Encriptar
    let encrypted = cipher.update(text, 'utf8');
    cipher.final();
    
    // Obtener el tag de autenticación
    const authTag = cipher.getAuthTag();
    
    // Combinar salt + iv + authTag + datos encriptados
    const result = Buffer.concat([salt, iv, authTag, encrypted]);
    
    // Retornar como base64
    return result.toString('base64');
  } catch (error) {
    throw new Error(`Error al encriptar: ${error.message}`);
  }
};

// Desencriptar texto
export const decryptData = async (encryptedData: string): Promise<string> => {
  try {
    // Decodificar desde base64
    const data = Buffer.from(encryptedData, 'base64');
    
    // Extraer componentes
    const salt = data.subarray(0, 16);
    const iv = data.subarray(16, 28);
    const authTag = data.subarray(28, 44);
    const encrypted = data.subarray(44);
    
    // Derivar la clave desde la contraseña
    const key = deriveKey(password, salt);
    
    // Crear el decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(Buffer.from('DeviceControl2'));
    decipher.setAuthTag(authTag);
    
    // Desencriptar
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decipher.final();
    
    return decrypted;
  } catch (error) {
    throw new Error(`Error al desencriptar: ${error.message}`);
  }
};