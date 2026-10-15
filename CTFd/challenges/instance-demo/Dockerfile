FROM python:3.11-slim-bookworm

WORKDIR /challenge

RUN useradd --uid 10001 --create-home player \
    && printf 'Your challenge instance is running.\n' > index.html \
    && printf 'flag{docker_instance_test}\n' > flag.txt

USER 10001

EXPOSE 8080

CMD ["python", "-m", "http.server", "8080", "--bind", "0.0.0.0"]