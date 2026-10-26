"""Smoke test: exits non-zero unless TensorFlow sees a GPU."""
import sys

import tensorflow as tf

gpus = tf.config.list_physical_devices("GPU")
print(f"TensorFlow {tf.__version__}, GPUs: {gpus}")
sys.exit(0 if gpus else 1)
