// install audiowaveform https://github.com/bbc/audiowaveform?tab=readme-ov-file#installation

const fs = require('fs');
const axios = require('axios');
const { exec } = require('child_process');
const path = require('path');

async function downloadAudioFile(url, outputPath) {
  const writer = fs.createWriteStream(outputPath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

function generateWaveformJson(audioFilePath, outputJsonPath) {
  return new Promise((resolve, reject) => {
    const command = `audiowaveform -i ${audioFilePath} -o ${outputJsonPath} --pixels-per-second 25 --bits 8 --output-format json`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve(outputJsonPath);
    });
  });
}

function parseWaveformJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      }

      const json = JSON.parse(data);

      const peaks = json.data;
      const pixelsPerSecond = 50;

      const duration = peaks.length / pixelsPerSecond;

      resolve({ peaks, duration });
    });
  });
}

async function getPeaksAndDurationFromAudioUrl(audioUrl) {
  const audioFilePath = path.resolve(__dirname, 'temp-audio-file.wav');
  const waveformJsonPath = path.resolve(__dirname, 'temp-waveform.json');

  try {
    await downloadAudioFile(audioUrl, audioFilePath);

    await generateWaveformJson(audioFilePath, waveformJsonPath);

    const { peaks, duration } = await parseWaveformJsonFile(waveformJsonPath);

    fs.unlinkSync(audioFilePath);
    fs.unlinkSync(waveformJsonPath);

    return { peaks, duration };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

const audioUrl = 'https://www2.cs.uic.edu/~i101/SoundFiles/preamble10.wav';

getPeaksAndDurationFromAudioUrl(audioUrl)
  .then(({ peaks, duration }) => {
    console.log('Peaks:', peaks);
    console.log('Duration (seconds):', duration);
  })
  .catch((error) => {
    console.error('Failed to get peaks and duration:', error);
  });
