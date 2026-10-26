# Record landmarks through the app's own pipeline

Training data is recorded in the Electron Dev UI, using the same `@mediapipe/tasks-vision` JS tracker the shipped app uses for inference, rather than in a separate Python + OpenCV collector. Recording in the production pipeline removes a whole class of differences between training and production landmarks, which is the same goal the normalization spec serves. The Python + MediaPipe script from Milestone 0 is only a camera and landmark viewer. It never writes to the dataset.

Hands from other people arrive as video files, because they won't run the dev stack. Imported videos go through the same JS tracker in video mode, resampled to the app's frame rate. The video is deleted after import, so only landmarks reach the dataset.
