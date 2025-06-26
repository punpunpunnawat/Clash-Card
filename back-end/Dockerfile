FROM golang:1.24.2 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
COPY .env .env

ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
RUN go build -o myapp .

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/
COPY --from=builder /app/myapp .

CMD ["./myapp"]

# FROM golang:1.24.2 AS builder

# WORKDIR /app

# COPY go.mod go.sum ./
# RUN go mod download

# COPY . .

# ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
# RUN go build -o myapp .

# FROM alpine:latest

# RUN apk --no-cache add ca-certificates

# WORKDIR /app
# COPY --from=builder /app/myapp .
# COPY --from=builder /app/.env .

# CMD ["./myapp"]
