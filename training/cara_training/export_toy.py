"""Spike #26: build a toy dense classifier on normalized landmark vectors and export it as TF.js layers.

Usage: python -m cara_training.export_toy OUT_DIR
"""
import os
import sys

# TF.js 4.22 can't load Keras 3 layer configs (InputLayer batch_shape, DTypePolicy); export via Keras 2 (tf-keras)
os.environ["TF_USE_LEGACY_KERAS"] = "1"

from cara_training.normalize import SLOT_SIZE

FEATURES = 2 * SLOT_SIZE  # one slot per hand
CLASSES = 3  # toy: idle + two gestures


def build():
    import tensorflow as tf

    tf.keras.utils.set_random_seed(0)
    return tf.keras.Sequential([
        tf.keras.Input(shape=(FEATURES,)),
        tf.keras.layers.Dense(32, activation="relu"),
        tf.keras.layers.Dense(CLASSES, activation="softmax"),
    ])


def main(out_dir):
    import tensorflowjs as tfjs

    tfjs.converters.save_keras_model(build(), out_dir)


if __name__ == "__main__":
    main(sys.argv[1])
