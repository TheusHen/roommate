FROM ubuntu:latest

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
        bash \
        curl \
        wget \
        nano \
        vim \
        git \
        build-essential \
    && apt-get clean

WORKDIR /app

COPY . .

RUN chmod +x ./scripts/start/run.sh

EXPOSE 80

CMD ["./scripts/start/run.sh"]