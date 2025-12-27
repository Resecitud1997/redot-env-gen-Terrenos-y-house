document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const dropZone = document.getElementById('drop-zone');
    const imageInput = document.getElementById('imageInput');
    const previewRef = document.getElementById('preview-ref');
    const btnGenerate = document.getElementById('btn-generate');
    const envCategory = document.getElementById('envCategory');
    const outputFormat = document.getElementById('outputFormat');
    const infoBox = document.getElementById('info-box');
    const resultsArea = document.getElementById('results-area');
    const resultCanvas = document.getElementById('resultCanvas');
    const btnDownload = document.getElementById('btn-download');

    let uploadedImage = null;
    let finalCanvasBlob = null; // Guardará la imagen final generada

    // 1. Lógica inteligente de UI
    // Cambiar la descripción según la categoría seleccionada
    envCategory.addEventListener('change', () => {
        const cat = envCategory.value;
        let msg = "";
        
        if(cat === 'terrain_basic') {
            outputFormat.value = 'atlas';
            msg = "💡 Para Terrenos: Se creará un Tileset 3x3 para usar con AutoTile en Redot.";
        } else if (cat === 'structure') {
            outputFormat.value = 'single';
            msg = "💡 Para Estructuras: Se procesará como un Sprite individual de alta calidad.";
        } else if (cat === 'liquid') {
            outputFormat.value = 'sheet';
            msg = "💡 Para Agua/Lava: Se generará un Sprite Sheet horizontal con frames de animación.";
        } else {
            outputFormat.value = 'single';
            msg = "💡 Para Naturaleza: Se optimizará para crear variaciones de frutas/rocas.";
        }
        infoBox.innerHTML = `<small>${msg}</small>`;
    });

    // 2. Manejo de Archivos (Drag & Drop)
    dropZone.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = '#4da6ff'; });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.style.borderColor = '#444'; });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#444';
        handleFile(e.dataTransfer.files[0]);
    });

    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImage = new Image();
                uploadedImage.src = e.target.result;
                uploadedImage.onload = () => {
                    previewRef.src = e.target.result;
                    previewRef.classList.remove('hidden');
                    document.querySelector('.placeholder-text').classList.add('hidden');
                    btnGenerate.disabled = false;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    // 3. GENERACIÓN DE ASSETS (Lógica de Procesamiento)
    btnGenerate.addEventListener('click', async () => {
        btnGenerate.textContent = "Procesando Geometría...";
        btnGenerate.disabled = true;
        
        const ctx = resultCanvas.getContext('2d');
        const mode = outputFormat.value;
        const category = envCategory.value;

        // Limpiar canvas
        ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);

        // Simulamos tiempo de "IA"
        await new Promise(r => setTimeout(r, 800));

        // -- LÓGICA DE DIBUJO SEGÚN TIPO --
        
        if (mode === 'atlas') {
            // Generar un Tileset 3x3 básico (ej: 96x96 si el tile es 32x32)
            const tileSize = 64; 
            resultCanvas.width = tileSize * 3;
            resultCanvas.height = tileSize * 3;
            
            // Dibujar la imagen repetida en una cuadrícula 3x3
            for(let y=0; y<3; y++) {
                for(let x=0; x<3; x++) {
                    ctx.drawImage(uploadedImage, x * tileSize, y * tileSize, tileSize, tileSize);
                    // Añadir una leve variación de color para simular texturas orgánicas
                    if((x+y)%2 === 0 && category === 'terrain_basic') {
                        ctx.fillStyle = 'rgba(0,0,0,0.1)';
                        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                    }
                }
            }
        } 
        else if (mode === 'sheet') {
            // Generar animación de agua (4 frames horizontales)
            const frameSize = 64;
            const frames = 4;
            resultCanvas.width = frameSize * frames;
            resultCanvas.height = frameSize;

            for(let i=0; i<frames; i++) {
                // Dibujar base
                ctx.drawImage(uploadedImage, i * frameSize, 0, frameSize, frameSize);
                
                // Simular olas (cambio de color/brillo progresivo)
                ctx.fillStyle = `rgba(255, 255, 255, ${i * 0.15})`; // Brillo de ola
                if(category === 'liquid') {
                    ctx.fillRect(i * frameSize, 10 + (i*5), frameSize, 5); // Linea de ola bajando
                }
            }
        } 
        else {
            // Estructura única (Casa/Roca)
            // Mantener ratio pero ajustar a potencia de 2 para videojuegos
            resultCanvas.width = uploadedImage.width;
            resultCanvas.height = uploadedImage.height;
            ctx.drawImage(uploadedImage, 0, 0);
            
            // Si es "nature_prop" (roca con musgo), añadir un detalle verde simple
            if(category === 'nature_prop') {
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = 'rgba(50, 200, 50, 0.3)'; // Musgo
                ctx.fillRect(0, resultCanvas.height - 20, resultCanvas.width, 20);
            }
        }

        resultsArea.classList.remove('hidden');
        btnGenerate.textContent = "Construir Assets";
        btnGenerate.disabled = false;

        // Preparar Blob para descarga
        resultCanvas.toBlob(blob => {
            finalCanvasBlob = blob;
        });
    });

    // 4. DESCARGA Y EMPAQUETADO ZIP
    btnDownload.addEventListener('click', () => {
        if (!finalCanvasBlob) return;

        const zip = new JSZip();
        const catName = envCategory.value;
        const folder = zip.folder(`Redot_Assets_${catName}`);

        // Nombre inteligente del archivo
        let filename = "asset.png";
        let instructions = "";

        if (outputFormat.value === 'atlas') {
            filename = "terrain_tileset.png";
            instructions = "Configuración en Redot:\n1. Crea un TileSet.\n2. Arrastra esta imagen.\n3. Configura 'Texture Region Size' a 64x64 (o el tamaño de tu tile).\n4. Usa Terrain Sets para pintar.";
        } else if (outputFormat.value === 'sheet') {
            filename = "liquid_animation_sheet.png";
            instructions = "Configuración en Redot:\n1. Usa un nodo AnimatedSprite2D.\n2. En SpriteFrames, añade esta hoja.\n3. Configura Hframes: 4, Vframes: 1.";
        } else {
            filename = "structure_prop.png";
            instructions = "Configuración en Redot:\n1. Importar como Texture2D.\n2. Usar en nodo Sprite2D.";
        }

        folder.file(filename, finalCanvasBlob);
        folder.file("redot_import_info.txt", instructions);

        zip.generateAsync({type:"blob"})
        .then(function(content) {
            saveAs(content, `Redot_${catName}_Pack.zip`);
        });
    });
});
