FROM tensorflow/tensorflow:2.16.2-gpu
WORKDIR /work
COPY pyproject.toml .
COPY cara_training cara_training
RUN pip install --no-cache-dir -e ".[export]"
