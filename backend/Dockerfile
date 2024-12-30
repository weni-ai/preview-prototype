# syntax = docker/dockerfile:1

ARG PYTHON_VERSION="3.11"
ARG DEBIAN_VERSION="buster"

ARG BUILD_DEPS="\
  python3-dev \
  build-essential \
  autoconf"

ARG RUNTIME_DEPS="\
  gosu"

FROM python:${PYTHON_VERSION}-slim-${DEBIAN_VERSION} as base

ENV PYTHONUNBUFFERED=1 \
  PYTHONDONTWRITEBYTECODE=1 \
  DEBIAN_FRONTEND=noninteractive \
  PROJECT=preview-prototype \
  PROJECT_PATH=/app \
  PROJECT_USER=app_user \
  PROJECT_GROUP=app_group \
  PIP_DISABLE_PIP_VERSION_CHECK=1 \
  PATH="/install/bin:${PATH}" \
  APP_PORT=5000 \
  APPLICATION_NAME="preview-prototype" \
  RUNTIME_DEPS=${RUNTIME_DEPS} \
  BUILD_DEPS=${BUILD_DEPS} \
  PYTHONIOENCODING=UTF-8
  
ARG COMPRESS_ENABLED
ARG BRANDING_ENABLED

RUN addgroup --gid 1999 "${PROJECT_GROUP}" \
  && useradd --system -m -d "${PROJECT_PATH}" -u 1999 -g 1999 "${PROJECT_USER}"

WORKDIR "${PROJECT_PATH}"

RUN rm -f /etc/apt/apt.conf.d/docker-clean; echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache

FROM base as build

ARG BUILD_DEPS

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  apt-get update \
  && apt-get install --no-install-recommends --no-install-suggests -y ${BUILD_DEPS}
 
COPY "requirements.txt" /tmp/dep/
RUN --mount=type=cache,mode=0755,target=/pip_cache,id=pip pip install --cache-dir /pip_cache --prefix=/install -r /tmp/dep/requirements.txt

FROM base

ARG BUILD_DEPS
ARG RUNTIME_DEPS

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  apt-get update \
  && SUDO_FORCE_REMOVE=yes apt-get remove --purge -y ${BUILD_DEPS} \
  && apt-get autoremove -y \
  && apt-get install -y --no-install-recommends ${RUNTIME_DEPS} \
  && rm -rf /usr/share/man /usr/share/doc

COPY --from=build /install /usr/local
COPY --chown=${PROJECT_USER}:${PROJECT_GROUP} . ${PROJECT_PATH}

USER "${PROJECT_USER}:${PROJECT_GROUP}"
EXPOSE 5000
ENTRYPOINT ["bash", "start"]
CMD ["start"]
