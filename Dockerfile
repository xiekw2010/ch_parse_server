FROM node:6

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
COPY . /usr/src/app

# Reset logs
RUN rm -rf /usr/src/app/logs
RUN rm -rf /usr/src/app/npm-debug.log
RUN rm -rf /usr/src/app/.idea
RUN rm -rf /usr/src/app/.github
RUN rm -rf /usr/src/app/test

EXPOSE 8080
ENV PORT=8080

ENV NODE_ENV=production
#ENV DASHBOARD_AUTH=username:password

CMD [ "node", "index.js" ]