FROM alpine
RUN adduser -D myLowPrivilegeUser
RUN apk add --no-cache curl
COPY smoke-test.sh smoke-test.sh
USER myLowPrivilegeUser
CMD ["sh", "smoke-test.sh", "http://app:3000"]
