let imgData1, imgData2; // Variáveis globais para armazenar os dados de pixel das imagens 1 e 2
let width, height; // Variáveis globais para armazenar a largura e altura das imagens

// 1) Obtenção dos elementos de input de arquivo do HTML para carregamento de imagens
const upload1 = document.getElementById("img1"); // Input para a primeira imagem
const upload2 = document.getElementById("img2"); // Input para a segunda imagem

// 1) Obtenção dos elementos canvas do HTML para exibição
const canvasOriginal = document.getElementById("canvasOriginal"); // Canvas para a imagem original (primeira)
const canvasImg2 = document.getElementById("canvasImg2"); // Canvas para a segunda imagem
const canvasGray = document.getElementById("canvasGray"); // Canvas para exibir a imagem em escala de cinza
const canvasResult = document.getElementById("canvasResult"); // Canvas principal para exibir os resultados das operações

// Obtenção dos contextos 2D de cada canvas para desenho e manipulação de pixels
const ctxOriginal = canvasOriginal.getContext("2d");
const ctxImg2 = canvasImg2.getContext("2d");
const ctxGray = canvasGray.getContext("2d");
const ctxResult = canvasResult.getContext("2d");

// Adiciona listeners para os eventos de mudança nos inputs de arquivo
// Quando um arquivo é selecionado, a função loadImage é chamada para processá-lo
upload1.addEventListener("change", (e) => loadImage(e.target.files[0], 1));
upload2.addEventListener("change", (e) => loadImage(e.target.files[0], 2));

/**
 * 1) Função `loadImage`: Carrega uma imagem do arquivo fornecido e a desenha no canvas apropriado.
 * Armazena os dados de pixel da imagem em `imgData1` ou `imgData2`.
 * Suporta diferentes formatos de imagem (BMP, JPG, PNG) implicitamente via `FileReader` e `Image`.
 * @param {File} file O objeto File da imagem selecionada.
 * @param {number} imgNumber O número da imagem (1 para imagem original, 2 para imagem secundária).
 */
function loadImage(file, imgNumber) {
  const reader = new FileReader(); // Cria um novo FileReader para ler o conteúdo do arquivo como uma URL de dados
  reader.onload = function (event) { // Função chamada quando o arquivo é lido com sucesso
    const img = new Image(); // Cria um novo objeto Image
    img.onload = function () { // Função chamada quando a imagem é carregada no objeto Image
      width = img.width; // Define a largura global com a largura da imagem
      height = img.height; // Define a altura global com a altura da imagem

      if (imgNumber === 1) { // Se for a imagem 1 (original)
        // Redimensiona todos os canvases para o tamanho da imagem original para consistência
        canvasOriginal.width = width;
        canvasOriginal.height = height;
        canvasGray.width = width;
        canvasGray.height = height;
        canvasResult.width = width;
        canvasResult.height = height;
        canvasImg2.width = width; // Também ajusta o canvas da imagem 2 para compatibilidade de dimensões
        canvasImg2.height = height;

        ctxOriginal.drawImage(img, 0, 0); // Desenha a imagem no canvas original
        // Armazena os dados de pixel da imagem original
        imgData1 = ctxOriginal.getImageData(0, 0, width, height);
      } else if (imgNumber === 2) { // Se for a imagem 2 (secundária)
        // Redimensiona apenas o canvas da imagem 2
        canvasImg2.width = width;
        canvasImg2.height = height;

        ctxImg2.drawImage(img, 0, 0); // Desenha a imagem no canvas da imagem 2
        // Armazena os dados de pixel da segunda imagem
        imgData2 = ctxImg2.getImageData(0, 0, width, height);
      }
    };
    img.src = event.target.result; // Define o source da imagem como o resultado da leitura do arquivo (URL de dados)
  };
  reader.readAsDataURL(file); // Inicia a leitura do conteúdo do arquivo como uma URL de dados
}

/**
 * 5) Função `toGrayscale`: Converte a imagem 1 para escala de cinza e exibe no canvas de resultados em cinza (`canvasGray`).
 * Implementa a conversão RGB para Escala de Cinza pela média simples.
 */
function toGrayscale() {
  if (!imgData1) return alert("Carregue a imagem 1."); // Verifica se a imagem 1 está carregada

  const result = ctxGray.createImageData(width, height); // Cria um novo ImageData para o resultado
  for (let i = 0; i < imgData1.data.length; i += 4) { // Percorre os pixels (cada pixel tem 4 componentes: R, G, B, A)
    const r = imgData1.data[i]; // Componente Vermelha
    const g = imgData1.data[i + 1]; // Componente Verde
    const b = imgData1.data[i + 2]; // Componente Azul
    const gray = (r + g + b) / 3; // Calcula o valor de cinza como a média dos canais RGB

    // Define as componentes R, G, B do pixel resultante para o valor de cinza
    result.data[i] = result.data[i + 1] = result.data[i + 2] = gray;
    result.data[i + 3] = 255; // Mantém o canal Alfa (transparência) totalmente opaco
  }
  ctxGray.putImageData(result, 0, 0); // Desenha a imagem em escala de cinza no canvas dedicado
}

/**
 * Função utilitária `applyOperation`: Aplica uma operação de pixel a pixel na imagem 1 (e imagem 2, se aplicável).
 * Os valores resultantes são "clampeados" (limitados) entre 0 e 255 para evitar OVERFLOW/UNDERFLOW.
 * @param {function} callback A função que define a operação, recebendo os valores de pixel 'a' (imagem 1) e 'b' (imagem 2).
 */
function applyOperation(callback) {
  if (!imgData1) return alert("Imagem 1 não carregada."); // Verifica se a imagem 1 está carregada

  const result = ctxResult.createImageData(width, height); // Cria um novo ImageData para o resultado
  for (let i = 0; i < imgData1.data.length; i += 4) { // Percorre os pixels
    const a = imgData1.data[i]; // Valor do pixel da imagem 1 (considerando R, G ou B, pois as operações são em cinza)
    // Valor do pixel da imagem 2, se existir; caso contrário, 0 (para operações unárias)
    const b = imgData2?.data[i] || 0;

    const val = callback(a, b); // Aplica a função de callback (operação aritmética/lógica)
    // Trata OVERFLOW e UNDERFLOW: clampeia o valor entre 0 e 255
    const final = Math.min(255, Math.max(0, val));

    // Define as componentes R, G, B para o valor final processado
    result.data[i] = result.data[i + 1] = result.data[i + 2] = final;
    result.data[i + 3] = 255; // Mantém o canal Alfa opaco
  }
  // 3) Exibe a imagem resultante na interface da aplicação (`canvasResult`)
  ctxResult.putImageData(result, 0, 0);
}

// 2a) Função `sumImages`: Soma as duas imagens. 
function sumImages() {
  if (!imgData2) return alert("Imagem 2 não carregada."); // Requer imagem 2
  applyOperation((a, b) => a + b); // Soma os pixels correspondentes
}

// 2b) Função `addConstant`: Soma um valor constante em cada pixel da imagem (Aumentar o brilho).
//     Tratamento de OVERFLOW é feito em `applyOperation`. 
function addConstant() {
  const c = parseInt(prompt("Valor a somar (0-255):", "50")) || 0; // Solicita ao usuário o valor da constante
  applyOperation((a) => a + c); // Soma a constante a cada pixel
}

// 2c) Função `subImages`: Subtrai as duas imagens.
function subImages() { 
  if (!imgData2) return alert("Imagem 2 não carregada."); // Requer imagem 2
  applyOperation((a, b) => a - b); // Subtrai os pixels correspondentes
}

// 2d) Função `subConstant`: Subtrai um valor constante em cada pixel da imagem (Diminuir o brilho).
//     Tratamento de UNDERFLOW é feito em `applyOperation`. 
function subConstant() {
  const c = parseInt(prompt("Valor a subtrair (0-255):", "50")) || 0; // Solicita ao usuário o valor da constante
  applyOperation((a) => a - c); // Subtrai a constante de cada pixel
}

// 2e) Função `multiplyConstant`: Multiplica um valor constante em cada pixel (Aumentar/Diminuir o contraste).
//     Tratamento de OVERFLOW e UNDERFLOW é feito em `applyOperation`. 
function multiplyConstant() {
  const c = parseFloat(prompt("Fator multiplicativo (ex: 1.5):", "1.5")) || 1; // Solicita o fator multiplicativo
  applyOperation((a) => a * c); // Multiplica cada pixel pela constante
}

// 2f) Função `divideConstant`: Divide um valor constante em cada pixel (Aumentar/Diminuir o contraste).
//     Tratamento de OVERFLOW e UNDERFLOW é feito em `applyOperation`. 
function divideConstant() {
  const c = parseFloat(prompt("Fator divisivo (ex: 1.5):", "1.5")) || 1; // Solicita o fator divisivo
  applyOperation((a) => a / c); // Divide cada pixel pela constante
}

// 8) Função `absDifference`: Calcula a diferença absoluta entre duas imagens. 
function absDifference() {
  if (!imgData2) return alert("Imagem 2 não carregada."); // Requer imagem 2
  applyOperation((a, b) => Math.abs(a - b)); // Calcula a diferença absoluta entre pixels
}

// 9) Função `blendImages`: Implementa a Combinação Linear (Blending). 
function blendImages() {
  if (!imgData2) return alert("Imagem 2 não carregada."); // Requer imagem 2
  // Solicita ao usuário o fator de mistura (alpha)
  const alpha = parseFloat(prompt("Fator de mistura (0.0 a 1.0):", "0.5")) || 0.5;
  applyOperation((a, b) => a * alpha + b * (1 - alpha)); // Combina as imagens com base no fator alpha
}

// 10) Função `averageImages`: Implementa a Combinação Linear (Média de duas imagens). 
function averageImages() {
  if (!imgData2) return alert("Imagem 2 não carregada."); // Requer imagem 2
  applyOperation((a, b) => (a + b) / 2); // Calcula a média dos pixels
}

/**
 * 11) Função `binaryLogicOp`: Implementa as Operações Lógicas (AND, OR, NOT, XOR) em imagens binárias.
 * @param {string} op A operação lógica a ser aplicada ("AND", "OR", "XOR", "NOT").
 */
function binaryLogicOp(op) {
  if (!imgData1) return alert("Imagem 1 não carregada.");
  if (!imgData2 && op !== "NOT") return alert("Imagem 2 não carregada para esta operação.");

  // Binariza as imagens de entrada
  const bin1 = binarize(imgData1);
  const bin2 = imgData2 ? binarize(imgData2) : null;

  const result = ctxResult.createImageData(width, height);
  for (let i = 0; i < bin1.data.length; i += 4) {
    // Converte os valores de pixel binarizados (0 ou 255) para 0 ou 1 para operações lógicas bit a bit
    let a = bin1.data[i] === 255 ? 1 : 0;
    let b = bin2 ? (bin2.data[i] === 255 ? 1 : 0) : 0;
    let res;

    switch (op) { // Aplica a operação lógica
      case "AND":
        res = a & b;
        break;
      case "OR":
        res = a | b;
        break;
      case "XOR":
        res = a ^ b;
        break;
      case "NOT":
        res = 1 - a; // NOT lógico (inverte 0 para 1 e 1 para 0)
        break;
      default:
        res = 0;
    }

    // Converte o resultado de volta para 0 (preto) ou 255 (branco)
    const pixel = res ? 255 : 0;
    result.data[i] = result.data[i + 1] = result.data[i + 2] = pixel;
    result.data[i + 3] = 255;
  }
  ctxResult.putImageData(result, 0, 0);
}

/**
 * Função auxiliar `binarize`: Converte uma imagem para binária (preto e branco) com base em um limiar.
 * Usada internamente para operações lógicas e morfológicas.
 * @param {ImageData} imgData Os dados de pixel da imagem a ser binarizada.
 * @param {number} threshold O valor do limiar (padrão: 127).
 * @returns {ImageData} Os dados de pixel da imagem binarizada.
 */
function binarize(imgData, threshold = 127) {
  const bin = new ImageData(width, height);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const gray = (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
    // Se o valor de cinza for maior ou igual ao limiar, o pixel é branco (255), senão preto (0)
    const binVal = gray >= threshold ? 255 : 0;
    bin.data[i] = bin.data[i + 1] = bin.data[i + 2] = binVal;
    bin.data[i + 3] = 255;
  }
  return bin;
}

/**
 * Função `resetImages`: Redefine o estado dos canvases, exibindo a imagem original 1 e limpando os outros.
 */
function resetImages() {
  if (!imgData1) return alert("Carregue a imagem 1 primeiro.");

  // Redefine o tamanho dos canvases para o tamanho original (caso tenha sido alterado)
  canvasOriginal.width = width;
  canvasOriginal.height = height;
  canvasGray.width = width;
  canvasGray.height = height;
  canvasResult.width = width;
  canvasResult.height = height;

  ctxOriginal.putImageData(imgData1, 0, 0); // Redesenha a imagem original 1 no canvasOriginal

  // Limpa os outros canvases
  ctxGray.clearRect(0, 0, width, height);
  ctxResult.clearRect(0, 0, width, height);
}

/**
 * 4) Função `saveResultImage`: Salva a imagem resultante do canvas `canvasResult` como um arquivo PNG.
 */
function saveResultImage() {
  const link = document.createElement('a'); // Cria um elemento 'a' (link) no DOM
  link.download = 'imagem_resultado.png'; // Define o nome do arquivo para download
  // Converte o conteúdo do canvas para uma URL de dados PNG
  link.href = canvasResult.toDataURL('image/png');
  link.click(); // Simula um clique para iniciar o download do arquivo
}

/**
 * 7) Função `flipVertical`: Inverte a imagem 1 de cima para baixo (verticalmente). 
 */
function flipVertical() {
  if (!imgData1) return alert("Carregue a imagem 1.");

  const result = ctxResult.createImageData(width, height);
  for (let y = 0; y < height; y++) { // Percorre as linhas
    for (let x = 0; x < width; x++) { // Percorre as colunas
      const i = (y * width + x) * 4; // Índice do pixel original (R, G, B, A)
      const flippedY = height - 1 - y; // Calcula a linha invertida
      const j = (flippedY * width + x) * 4; // Índice do pixel na nova posição invertida

      // Copia os valores de R, G, B, A do pixel original para a posição invertida
      result.data[j] = imgData1.data[i];
      result.data[j + 1] = imgData1.data[i + 1];
      result.data[j + 2] = imgData1.data[i + 2];
      result.data[j + 3] = imgData1.data[i + 3];
    }
  }
  ctxResult.putImageData(result, 0, 0);
}

/**
 * 6) Função `flipHorizontal`: Inverte a imagem 1 da esquerda para a direita (horizontalmente). 
 */
function flipHorizontal() {
  if (!imgData1) return alert("Carregue a imagem 1.");

  const result = ctxResult.createImageData(width, height);
  for (let y = 0; y < height; y++) { // Percorre as linhas
    for (let x = 0; x < width; x++) { // Percorre as colunas
      const i = (y * width + x) * 4; // Índice do pixel original
      const flippedX = width - 1 - x; // Calcula a coluna invertida
      const j = (y * width + flippedX) * 4; // Índice do pixel na nova posição invertida

      result.data[j] = imgData1.data[i];
      result.data[j + 1] = imgData1.data[i + 1];
      result.data[j + 2] = imgData1.data[i + 2];
      result.data[j + 3] = imgData1.data[i + 3];
    }
  }
  ctxResult.putImageData(result, 0, 0);
}

/**
 * 13) Função `thresholdImage`: Implementa a Limiarização de Imagens. 
 * Converte a imagem 1 para uma imagem binária com base em um limiar definido pelo usuário.
 */
function thresholdImage() {
  if (!imgData1) return alert("Carregue a imagem 1 primeiro.");

  // Solicita ao usuário o valor do limiar
  const threshold = parseInt(prompt("Digite o valor de limiar (0-255):", "127")) || 127;

  const result = ctxResult.createImageData(width, height);
  for (let i = 0; i < imgData1.data.length; i += 4) {
    const r = imgData1.data[i];
    const g = imgData1.data[i + 1];
    const b = imgData1.data[i + 2];
    const gray = (r + g + b) / 3; // Calcula o valor de cinza
    // Se o valor de cinza for maior ou igual ao limiar, o pixel se torna branco (255), senão preto (0)
    const bin = gray >= threshold ? 255 : 0;

    result.data[i] = result.data[i + 1] = result.data[i + 2] = bin;
    result.data[i + 3] = 255;
  }
  ctxResult.putImageData(result, 0, 0);
}

/**
 * 12) Função `equalizeHistogram`: Implementa a Equalização de Histograma. 
 * Melhora o contraste da imagem ao distribuir os níveis de intensidade de forma mais uniforme.
 */
function equalizeHistogram() {
  if (!imgData1) return alert("Carregue a imagem 1 primeiro.");

  const grayData = new Uint8Array(width * height); // Array para armazenar os valores de cinza de cada pixel
  const histogram = new Array(256).fill(0); // Histograma: contagem de pixels para cada nível de cinza (0-255)
  const totalPixels = width * height; // Número total de pixels na imagem

  // 1. Converter a imagem para escala de cinza e calcular o histograma
  for (let i = 0, j = 0; i < imgData1.data.length; i += 4, j++) {
    const r = imgData1.data[i];
    const g = imgData1.data[i + 1];
    const b = imgData1.data[i + 2];
    const gray = Math.round((r + g + b) / 3); // Calcula o valor de cinza arredondado
    grayData[j] = gray; // Armazena o valor de cinza
    histogram[gray]++; // Incrementa a contagem para este nível de cinza no histograma
  }

  // 2. Calcular a CDF (Função de Distribuição Acumulada)
  const cdf = new Array(256).fill(0);
  cdf[0] = histogram[0]; // O primeiro valor da CDF é igual ao primeiro valor do histograma
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + histogram[i]; // Cada valor da CDF é a soma acumulada dos valores do histograma
  }

  // Encontra o primeiro valor não zero na CDF (minCdf)
  const cdfMin = cdf.find((val) => val > 0);

  // 3. Criar a LUT (Tabela de Consulta - Look-Up Table) para mapeamento dos novos valores de pixel
  const lut = new Array(256);
  for (let i = 0; i < 256; i++) {
    // Aplica a fórmula de equalização de histograma
    lut[i] = Math.round(((cdf[i] - cdfMin) / (totalPixels - cdfMin)) * 255);
  }

  // 4. Aplicar a LUT para criar a nova imagem equalizada
  const result = ctxResult.createImageData(width, height);
  for (let i = 0, j = 0; i < result.data.length; i += 4, j++) {
    const val = lut[grayData[j]]; // Mapeia o valor de cinza original para o novo valor equalizado usando a LUT
    result.data[i] = result.data[i + 1] = result.data[i + 2] = val; // Define R, G, B para o novo valor
    result.data[i + 3] = 255; // Mantém o canal Alfa opaco
  }

  ctxResult.putImageData(result, 0, 0); // Desenha a imagem equalizada no canvas de resultado
}

/**
 * Função `applyKernelFilter`: Aplica um filtro de kernel (máscara de convolução) na imagem 1 (convertida para cinza).
 * Fundamental para os filtros espaciais (Passa-Baixa e Passa-Alta).
 * @param {Array<Array<number>>} kernel A matriz (kernel) que define o filtro.
 * @param {boolean} normalize Se true, o kernel é normalizado pela soma de seus elementos para preservar o brilho.
 */
function applyKernelFilter(kernel, normalize = true) {
  if (!imgData1) return alert("Carregue a imagem 1 primeiro.");

  const result = ctxResult.createImageData(width, height);
  const pixels = imgData1.data; // Dados de pixel da imagem original (entrada)
  const output = result.data; // Dados de pixel da imagem de saída

  const kSize = kernel.length; // Tamanho do kernel (ex: 3 para 3x3)
  const kHalf = Math.floor(kSize / 2); // Metade do tamanho do kernel (para centralizar o kernel no pixel atual)
  // Divisor para normalização: soma de todos os elementos do kernel. Se a soma for 0 ou normalização desativada, usa 1.
  const divisor = normalize ? kernel.flat().reduce((a, b) => a + b, 0) || 1 : 1;

  for (let y = 0; y < height; y++) { // Percorre as linhas da imagem
    for (let x = 0; x < width; x++) { // Percorre as colunas da imagem
      let sum = 0; // Soma ponderada dos pixels vizinhos
      for (let ky = 0; ky < kSize; ky++) { // Percorre as linhas do kernel
        for (let kx = 0; kx < kSize; kx++) { // Percorre as colunas do kernel
          const px = x + kx - kHalf; // Coordenada X do pixel vizinho na imagem
          const py = y + ky - kHalf; // Coordenada Y do pixel vizinho na imagem
          // Verifica se o pixel vizinho está dentro dos limites da imagem
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4; // Índice do pixel vizinho no array de dados
            // Obtém o valor de cinza do pixel vizinho (média dos canais RGB)
            const gray = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
            // Multiplica o valor de cinza pelo elemento correspondente do kernel e soma
            sum += gray * kernel[ky][kx];
          }
        }
      }
      // Aplica a normalização e clampeia o valor resultante entre 0 e 255
      const val = Math.min(255, Math.max(0, sum / divisor));
      const i = (y * width + x) * 4; // Índice do pixel de saída
      output[i] = output[i + 1] = output[i + 2] = val; // Define R, G, B para o valor processado
      output[i + 3] = 255; // Mantém o canal Alfa opaco
    }
  }
  ctxResult.putImageData(result, 0, 0); // Desenha o resultado no canvas
}

// 14) Função `filterMean`: Implementa o filtro MEAN (Média).
// É um filtro passa-baixa para suavização.
function filterMean() {
  const kernel = [ // Kernel para filtro da média (box blur)
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ];
  applyKernelFilter(kernel, true); // Aplica o kernel com normalização
}

/**
 * 14) Funções `filterMinMax`: Implementa os filtros MAX e MIN. 
 * @param {string} type O tipo de filtro a ser aplicado ("max" para filtro de máximo, "min" para filtro de mínimo).
 */
function filterMinMax(type = "max") {
  if (!imgData1) return alert("Carregue a imagem 1 primeiro.");

  const result = ctxResult.createImageData(width, height);
  const kHalf = 1; // Raio da vizinhança (para kernel 3x3, kHalf = 1)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let values = []; // Array para armazenar os valores de cinza dos vizinhos
      for (let dy = -kHalf; dy <= kHalf; dy++) { // Percorre as linhas da vizinhança
        for (let dx = -kHalf; dx <= kHalf; dx++) { // Percorre as colunas da vizinhança
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && px < width && py >= 0 && py < height) { // Verifica se o vizinho está dentro dos limites
            const i = (py * width + px) * 4;
            const gray = (imgData1.data[i] + imgData1.data[i + 1] + imgData1.data[i + 2]) / 3;
            values.push(gray); // Adiciona o valor de cinza do vizinho ao array
          }
        }
      }
      // Calcula o novo valor do pixel: máximo ou mínimo entre os vizinhos
      const newVal = type === "max" ? Math.max(...values) : Math.min(...values);
      const i = (y * width + x) * 4;
      result.data[i] = result.data[i + 1] = result.data[i + 2] = newVal;
      result.data[i + 3] = 255;
    }
  }
  ctxResult.putImageData(result, 0, 0);
}

/**
 * 15) Função `filterMedian`: Implementa o filtro MEDIANA para remoção de ruído sal e pimenta.
 */
function filterMedian() {
  if (!imgData1) return alert("Carregue a imagem 1 primeiro.");

  const result = ctxResult.createImageData(width, height);
  const kHalf = 1; // Raio da vizinhança (para kernel 3x3)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let values = []; // Array para armazenar os valores de cinza dos vizinhos
      for (let dy = -kHalf; dy <= kHalf; dy++) {
        for (let dx = -kHalf; dx <= kHalf; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const i = (py * width + px) * 4;
            const gray = (imgData1.data[i] + imgData1.data[i + 1] + imgData1.data[i + 2]) / 3;
            values.push(gray);
          }
        }
      }
      values.sort((a, b) => a - b); // Ordena os valores dos vizinhos
      const median = values[Math.floor(values.length / 2)]; // Encontra o valor do meio (mediana)
      const i = (y * width + x) * 4;
      result.data[i] = result.data[i + 1] = result.data[i + 2] = median;
      result.data[i + 3] = 255;
    }
  }
  ctxResult.putImageData(result, 0, 0);
}

/**
 * 16) Função `filterOrder`: Implementa o filtro ORDEM. 
 * Seleciona o n-ésimo menor valor na vizinhança do pixel.
 * @param {number} n A ordem do elemento a ser selecionado (0-indexado).
 */
function filterOrder(n = 1) { // Default n=1 (segundo menor)
  if (!imgData1) return alert("Carregue a imagem 1 primeiro.");

  const result = ctxResult.createImageData(width, height);
  const kHalf = 1; // Raio da vizinhança

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let values = [];
      for (let dy = -kHalf; dy <= kHalf; dy++) {
        for (let dx = -kHalf; dx <= kHalf; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const i = (py * width + px) * 4;
            const gray = (imgData1.data[i] + imgData1.data[i + 1] + imgData1.data[i + 2]) / 3;
            values.push(gray);
          }
        }
      }
      values.sort((a, b) => a - b); // Ordena os valores dos vizinhos
      // Seleciona o elemento de ordem n, garantindo que o índice seja válido
      const val = values[Math.max(0, Math.min(n, values.length - 1))];
      const i = (y * width + x) * 4;
      result.data[i] = result.data[i + 1] = result.data[i + 2] = val;
      result.data[i + 3] = 255;
    }
  }
  ctxResult.putImageData(result, 0, 0);
}

/**
 * 17) Função `filterConservativeSmoothing`: Implementa o filtro SUAVIZAÇÃO CONSERVATIVA.
 * Um filtro de suavização que tenta preservar as bordas.
 */
function filterConservativeSmoothing() {
  if (!imgData1) return alert("Carregue a imagem 1 primeiro.");

  const result = ctxResult.createImageData(width, height);
  const kHalf = 1; // Raio da vizinhança

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let values = []; // Array para armazenar os valores de cinza dos vizinhos (excluindo o central)
      const idx = (y * width + x) * 4; // Índice do pixel central
      const center = (imgData1.data[idx] + imgData1.data[idx + 1] + imgData1.data[idx + 2]) / 3; // Valor de cinza do pixel central

      for (let dy = -kHalf; dy <= kHalf; dy++) {
        for (let dx = -kHalf; dx <= kHalf; dx++) {
          if (dx === 0 && dy === 0) continue; // Pula o pixel central
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const i = (py * width + px) * 4;
            const gray = (imgData1.data[i] + imgData1.data[i + 1] + imgData1.data[i + 2]) / 3;
            values.push(gray);
          }
        }
      }

      const min = Math.min(...values); // Encontra o valor mínimo entre os vizinhos
      const max = Math.max(...values); // Encontra o valor máximo entre os vizinhos
      // O pixel central é ajustado apenas se for menor que o mínimo dos vizinhos ou maior que o máximo dos vizinhos.
      // Caso contrário, mantém seu valor original.
      const newVal = center < min ? min : center > max ? max : center;

      result.data[idx] = result.data[idx + 1] = result.data[idx + 2] = newVal;
      result.data[idx + 3] = 255;
    }
  }
  ctxResult.putImageData(result, 0, 0);
}

/**
 * 18) Função `filterGaussian`: Implementa o filtro GAUSSIANO. 
 * Um filtro de suavização que aplica pesos maiores aos pixels mais próximos do centro.
 */
function filterGaussian() {
  const kernel = [ // Kernel Gaussiano 3x3
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ];
  applyKernelFilter(kernel, true); // Aplica o kernel com normalização
}

/**
 * Função `applyEdgeDetection`: Aplica um detector de bordas usando dois kernels (horizontal e vertical).
 * Calcula a magnitude do gradiente para realçar as bordas.
 * Base para os filtros de primeira ordem (Prewitt, Sobel).
 * @param {Array<Array<number>>} kernelX O kernel para detecção de bordas na direção X.
 * @param {Array<Array<number>>} kernelY O kernel para detecção de bordas na direção Y.
 */
function applyEdgeDetection(kernelX, kernelY) {
  if (!imgData1) return alert("Carregue a imagem 1 primeiro.");

  const result = ctxResult.createImageData(width, height);
  const pixels = imgData1.data;
  const output = result.data;

  const kSize = kernelX.length; // Tamanho do kernel
  const kHalf = Math.floor(kSize / 2); // Metade do tamanho do kernel

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let gx = 0, gy = 0; // Componentes do gradiente em X e Y

      for (let ky = 0; ky < kSize; ky++) {
        for (let kx = 0; kx < kSize; kx++) {
          const px = x + kx - kHalf;
          const py = y + ky - kHalf;
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4;
            const gray = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3; // Valor de cinza do vizinho
            gx += gray * kernelX[ky][kx]; // Aplica o kernel X (para gradiente horizontal)
            gy += gray * kernelY[ky][kx]; // Aplica o kernel Y (para gradiente vertical)
          }
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy); // Calcula a magnitude do gradiente (intensidade da borda)
      const val = Math.min(255, Math.max(0, magnitude)); // Clampeia o valor
      const i = (y * width + x) * 4;
      output[i] = output[i + 1] = output[i + 2] = val;
      output[i + 3] = 255;
    }
  }
  ctxResult.putImageData(result, 0, 0);
}

// 19) Função `detectEdgesPrewitt`: Implementa Detecção de Borda de Primeira Ordem - Prewitt.
function detectEdgesPrewitt() {
  const prewittX = [ // Kernel Prewitt para bordas verticais
    [-1, 0, 1],
    [-1, 0, 1],
    [-1, 0, 1]
  ];
  const prewittY = [ // Kernel Prewitt para bordas horizontais
    [1, 1, 1],
    [0, 0, 0],
    [-1, -1, -1]
  ];
  applyEdgeDetection(prewittX, prewittY);
}

// 19) Função `detectEdgesSobel`: Implementa Detecção de Borda de Primeira Ordem - Sobel.
function detectEdgesSobel() {
  const sobelX = [ // Kernel Sobel para bordas verticais
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];
  const sobelY = [ // Kernel Sobel para bordas horizontais
    [1, 2, 1],
    [0, 0, 0],
    [-1, -2, -1]
  ];
  applyEdgeDetection(sobelX, sobelY);
}

// 20) Função `detectEdgesLaplacian`: Implementa Detecção de Borda de Segunda Ordem - Laplaciano.
function detectEdgesLaplacian() {
  const laplacian = [ // Kernel Laplaciano
    [0, -1, 0],
    [-1, 4, -1],
    [0, -1, 0]
  ];
  applyKernelFilter(laplacian, false); // Aplica o kernel sem normalização
}

// Função auxiliar interna para binarizar uma imagem, usada especificamente para morfologia.
function binarizeImage(threshold = 127) {
  const bin = new ImageData(width, height);
  for (let i = 0; i < imgData1.data.length; i += 4) {
    const gray = (imgData1.data[i] + imgData1.data[i + 1] + imgData1.data[i + 2]) / 3;
    const val = gray >= threshold ? 255 : 0;
    bin.data[i] = bin.data[i + 1] = bin.data[i + 2] = val;
    bin.data[i + 3] = 255;
  }
  return bin;
}

// Elemento estruturante 3x3 para operações morfológicas (representa a vizinhança de um pixel)
const structuringElement = [
  [-1, -1], [-1, 0], [-1, 1], // Topo esquerdo, Topo, Topo direito
  [0, -1], [0, 0], [0, 1],     // Meio esquerdo, Centro, Meio direito
  [1, -1], [1, 0], [1, 1]      // Baixo esquerdo, Baixo, Baixo direito
];

/**
 * 21) Função `morphDilate`: Implementa a operação de Dilatação morfológica. 
 * "Engrossa" ou "expande" as regiões brancas (objetos) em uma imagem binária.
 */
function morphDilate() {
  const src = binarizeImage(); // Binariza a imagem original para a operação
  const result = ctxResult.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0; // Valor padrão (preto)
      // Itera sobre os offsets do elemento estruturante
      for (const [dy, dx] of structuringElement) {
        const nx = x + dx; // Coordenada X do vizinho
        const ny = y + dy; // Coordenada Y do vizinho
        // Verifica se o vizinho está dentro dos limites da imagem e se é branco
        if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
          const i = (ny * width + nx) * 4;
          if (src.data[i] === 255) { // Se qualquer vizinho coberto pelo elemento estruturante for branco
            value = 255; // O pixel central na imagem de saída se torna branco
            break; // Já dilatou, não precisa verificar mais vizinhos para este pixel
          }
        }
      }
      const idx = (y * width + x) * 4;
      result.data[idx] = result.data[idx + 1] = result.data[idx + 2] = value;
      result.data[idx + 3] = 255;
    }
  }
  ctxResult.putImageData(result, 0, 0);
}

/**
 * 21) Função `morphErode`: Implementa a operação de Erosão morfológica. 
 * "Afina" ou "encolhe" as regiões brancas (objetos) em uma imagem binária.
 */
function morphErode() {
  const src = binarizeImage(); // Binariza a imagem original
  const result = ctxResult.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let allMatch = true; // Flag para verificar se todos os vizinhos no elemento estruturante são brancos
      for (const [dy, dx] of structuringElement) {
        const nx = x + dx;
        const ny = y + dy;
        // Se o vizinho estiver fora dos limites ou se for preto, a condição de erosão não é satisfeita
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || src.data[(ny * width + nx) * 4] === 0) {
          allMatch = false;
          break;
        }
      }
      const idx = (y * width + x) * 4;
      // Se todos os vizinhos cobertos pelo elemento estruturante forem brancos, o pixel central fica branco, senão preto
      const value = allMatch ? 255 : 0;
      result.data[idx] = result.data[idx + 1] = result.data[idx + 2] = value;
      result.data[idx + 3] = 255;
    }
  }
  ctxResult.putImageData(result, 0, 0);
}

/**
 * 21) Função `morphOpen`: Implementa a operação de Abertura morfológica: Erosão seguida de Dilatação.
 * Ajuda a remover ruídos pequenos e pontilhados.
 */
function morphOpen() {
  // Primeiramente, aplica a erosão. O resultado é desenhado em `canvasResult` e os dados são copiados para `imgData1`
  // para que a próxima operação (dilatação) atue sobre a imagem erodida.
  morphErode();
  imgData1 = ctxResult.getImageData(0, 0, width, height); // Atualiza imgData1 com o resultado da erosão
  morphDilate(); // Em seguida, aplica a dilatação na imagem erodida
}

/**
 * 21) Função `morphClose`: Implementa a operação de Fechamento morfológica: Dilatação seguida de Erosão.
 * (Slide PI_04 - Pág. 65)
 * Ajuda a preencher pequenos buracos e quebras em objetos.
 */
function morphClose() {
  // Primeiramente, aplica a dilatação. O resultado é desenhado em `canvasResult` e os dados são copiados para `imgData1`.
  morphDilate();
  imgData1 = ctxResult.getImageData(0, 0, width, height); // Atualiza imgData1 com o resultado da dilatação
  morphErode(); // Em seguida, aplica a erosão na imagem dilatada
}

/**
 * 21) Função `morphContour`: Implementa a operação de Contorno morfológica.
 * Obtém o contorno de objetos subtraindo a imagem erodida da imagem original binarizada.
 */
function morphContour() {
  const original = binarizeImage(); // Binariza a imagem original para a operação
  const eroded = ctxResult.createImageData(width, height); // Cria ImageData para a imagem erodida

  // Executa o processo de erosão internamente para obter a imagem erodida.
  // Isso evita dependência direta de `morphErode()` que desenha no canvas.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let allMatch = true;
      for (const [dy, dx] of structuringElement) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || original.data[(ny * width + nx) * 4] === 0) {
          allMatch = false;
          break;
        }
      }
      const idx = (y * width + x) * 4;
      const val = allMatch ? 255 : 0;
      eroded.data[idx] = eroded.data[idx + 1] = eroded.data[idx + 2] = val;
      eroded.data[idx + 3] = 255;
    }
  }

  // Subtrai a imagem erodida da imagem original para obter apenas os pixels do contorno
  const result = ctxResult.createImageData(width, height);
  for (let i = 0; i < original.data.length; i += 4) {
    // A diferença de pixels binários (255 - 0 = 255 para contorno, 255 - 255 = 0 para dentro, 0 - 0 = 0 para fora)
    const diff = original.data[i] - eroded.data[i];
    result.data[i] = result.data[i + 1] = result.data[i + 2] = Math.max(0, diff); // Clampeia para não ter valores negativos
    result.data[i + 3] = 255;
  }

  ctxResult.putImageData(result, 0, 0);
}