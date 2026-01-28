const fs = require('fs');
const path = require('path');

// 1. Carpetas a ignorar (¡IMPORTANTE!)
const ignoreList = [
  'node_modules', '.git', 'dist', 'build', 'coverage', 
  '.vscode', 'package-lock.json', 'generar_contexto.js'
];

// 2. Archivos que queremos leer (Tu stack: JS, React, SQL, CSS)
const extensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.sql', '.json'];

// Nombre del archivo final
const outputFile = 'contexto_proyecto.txt';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    
    // Ignorar carpetas prohibidas
    if (ignoreList.some(ignored => fullPath.includes(path.sep + ignored))) {
      return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Solo agregar si tiene una extensión permitida
      if (extensions.includes(path.extname(file))) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

try {
  console.log("🔍 Escaneando proyecto...");
  const allFiles = getAllFiles(__dirname);
  let content = "CONTEXTO DEL PROYECTO (FECHA: " + new Date().toISOString() + "):\n\n";

  allFiles.forEach(file => {
      // Usar ruta relativa para que yo entienda la estructura de carpetas
      const relativePath = path.relative(__dirname, file);
      content += `\n==================================================================\n`;
      content += `ARCHIVO: ${relativePath}\n`;
      content += `==================================================================\n`;
      content += fs.readFileSync(file, 'utf8');
      content += `\n\n`;
  });

  fs.writeFileSync(outputFile, content);
  console.log(`✅ ¡Listo! Se ha creado el archivo: ${outputFile}`);
  console.log(`📂 Encuéntralo en tu carpeta raíz y súbelo al chat.`);
  
} catch (error) {
  console.error("❌ Hubo un error:", error);
}