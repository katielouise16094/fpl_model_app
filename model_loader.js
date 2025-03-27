import * as tf from '@tensorflow/tfjs';
import * as tfReactNative from '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

export const loadModel = async () => {
  await tfReactNative.ready();
  return await tf.loadLayersModel(
    bundleResourceIO(
      require('./assets/tfjs_model/model.json'),
      require('./assets/tfjs_model/group1-shard1of1.bin')
    )
  );
};

export const predictPoints = async (model, playerStats) => {
  if (!model) return "Model not loaded yet";

  const inputTensor = tf.tensor2d([playerStats]);
  const predictionTensor = model.predict(inputTensor);
  const predictedPoints = predictionTensor.dataSync()[0];

  return predictedPoints.toFixed(2); // Round to 2 decimal places
};
