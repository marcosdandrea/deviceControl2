const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join("..", 'package.json');

if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: No se encontró el archivo package.json.');
    process.exit(1);
}

try {
    const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageData = JSON.parse(packageContent);

    if (!packageData.version) {
        console.error("Error: La propiedad 'version' no existe en package.json.");
        process.exit(1);
    }

    const versionParts = packageData.version.split('.');
    if (versionParts.length !== 3) {
        console.error('Error: La versión debe tener el formato MAJOR.MINOR.PATCH.');
        process.exit(1);
    }

    let [major, minor, patch] = versionParts;
    patch = parseInt(patch, 10);

    if (isNaN(patch)) {
        console.error('Error: El número de patch no es válido.');
        process.exit(1);
    }

    patch++; // Incrementa el patch
    packageData.version = `${major}.${minor}.${patch}`;

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2), 'utf8');
    console.log(`Versión actualizada a ${packageData.version}`);

} catch (error) {
    console.error('Error al procesar el archivo package.json:', error.message);
    process.exit(1);
}