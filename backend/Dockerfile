# syntax = docker/dockerfile:1

# Use Ruby 3.3.7
ARG RUBY_VERSION=3.3.7
FROM ruby:$RUBY_VERSION-slim

# Rails app lives here
WORKDIR /rails

# Install base packages
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    ca-certificates \
    default-mysql-client \
    default-libmysqlclient-dev \
    libyaml-dev \
    git && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Install application gems
COPY Gemfile Gemfile.lock ./

# Install matching Bundler version
RUN gem install bundler -v 2.6.8

ENV PATH="/rails/vendor/bundle/ruby/3.3.0/bin:$PATH"    

# Configure bundler and install gems with retry logic
RUN bundle config set --local deployment 'false' && \
    bundle config set --local path 'vendor/bundle' && \
    bundle install --jobs 4 --retry 3

# Copy application code
COPY . .

# Precompile bootsnap code for faster boot times
RUN bundle exec bootsnap precompile --gemfile app/ lib/

# Entrypoint prepares the database
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Start the server by default
EXPOSE 3000

ENV BUNDLE_PATH=/rails/vendor/bundle
ENV BUNDLE_BIN=/rails/vendor/bundle/bin
ENV PATH="/rails/vendor/bundle/bin:$PATH"

CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]