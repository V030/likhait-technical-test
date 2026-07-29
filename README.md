> [!IMPORTANT]
> **This repository was created for LiKHA-IT's technical test and does not guarantee functionality.**

# Technical Assessment

## Overview

Welcome to the technical assessment phase of our recruitment process. This take-home examination is designed to evaluate your coding standards, problem-solving skills, and ability to navigate an existing codebase.

## 1. Timeline and Communication

- **Duration**: You have 3 calendar days to complete this assessment, starting from the time the invitation email was received.
- **Support**: We do not provide technical support.

## 2. Environment Setup

- **Forking**: Please fork this repository to your personal GitHub account.
- **Visibility**: Ensure your forked repository is set to **Public** so our engineering team can review your code submission.

## 3. Scope of Work

Upon setting up the repository, locate the `TICKETS.md` file in the root directory. This file contains the detailed specifications for the required tasks:

- 1 Feature Implementation
- 1 Bug Fix

## 4. Development Workflow

We expect you to follow best practices regarding version control and documentation:

- **Branching**: Create a dedicated branch for each specific task. Do not commit all changes to the main branch directly. (NOTE: please double check your work and make sure all tests pass)
- **Pull Requests**: Open a separate Pull Request (PR) for each task.
- **Documentation**: We place high value on communication. Ensure your PR descriptions are thorough, explaining your logic, architectural decisions, and how you solved the specific problem.

## 5. Evaluation Criteria

We will review your submission based on the following:

- **Solution Quality**: Functionality and robustness of the code.
- **Code Quality**: Cleanliness, readability, and adherence to standard patterns.
- **Documentation**: The clarity and detail of your Pull Request descriptions.
- **Going Above and Beyond**: You are encouraged to review the entire codebase. If you identify architectural flaws, security risks, or areas for optimization, feel free to open additional PRs or include a critique in your notes. This initiative is highly valued.

## 6. Submission Instructions

Once you have completed the assessment, please reply to the invitation email with the direct links to your Pull Requests using the format below:

Email subject

```
LiKHA-IT TECHNICAL TEST: [Your name]
```

Email contents

```
TASK 1: [Link to Feature PR]
TASK 2: [Link to Bug Fix PR]
BONUS/CRITIQUE: [Link to Optional/Refactoring PR]
** add any other PRs as needed **
```

NOTE: Please don't embed the PR url with the PR title. The following will suffice: `PR Title: https://github.com/{your-github-id}/likhait-technical-test/pull/{pull-request-number}`

Good luck, and we look forward to reviewing your code.

---

# System Description

A full-stack expense tracking application with calendar-based visualization for managing personal finances.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Running Tests](#running-tests)
- [Database Operations](#database-operations)
- [Environment Configuration](#environment-configuration)
- [Contributing](#contributing)
- [Technical Assessment](#technical-assessment)

## Overview

The Expense System is a modern web application designed to help users track and visualize their expenses through an intuitive calendar interface. Built with a React frontend and Rails API backend, it provides a seamless experience for recording daily expenses, categorizing spending, and understanding financial patterns.

## Core Concepts

### Calendar-Based Visualization

Expenses are displayed in a monthly calendar grid, making it easy to see spending patterns across days and weeks.

### Category Organization

All expenses are organized into 10 predefined categories (Food, Transport, Housing, Entertainment, Healthcare, Education, Shopping, Work, Utilities, Other), each with visual emoji indicators.

### Real-Time Updates

The application provides instant feedback when creating, updating, or deleting expenses without page reloads.

### RESTful Architecture

Clean separation between frontend and backend enables scalability and maintainability.

## Technology Stack

### Frontend

- **React 18.2** with **TypeScript 5.3** for type-safe UI development
- **Vite 5.1** as the modern build tool and development server
- Custom **"Vibes"** component library for consistent design

### Backend

- **Ruby 3.3.7** with **Rails 7.2** in API-only mode
- **MySQL 8.0** for relational data storage
- **RSpec** for comprehensive testing

### Infrastructure

- **Docker Compose** for containerized development and deployment
- **Puma** web server for handling concurrent requests
- **CORS** configured for frontend-backend communication

## Quick Start

### Using Docker (Recommended)

```bash
# Clone and navigate to project
cd expense_system_rails

# Start all services
docker compose up

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000/api
```

### Manual Setup

#### Backend

```bash
cd backend
bundle install
rails db:create db:migrate db:seed
rails server  # Starts on port 3000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev  # Starts on port 5173
```

## Running Tests

### Backend Tests

```bash
cd backend
bundle exec rspec
bundle exec rubocop
```

## Database Operations

### Using Docker

```bash
docker compose exec backend rails db:migrate
docker compose exec backend rails db:reset
docker compose exec backend rails console
```

### Without Docker

```bash
cd backend
rails db:migrate
rails db:reset
rails console
```

## Environment Configuration

### Backend Environment Variables (Production)

```bash
DATABASE_HOST=your-db-host
DATABASE_USERNAME=your-db-user
DATABASE_PASSWORD=your-password
RAILS_ENV=production
SECRET_KEY_BASE=$(rails secret)
```

## Contributing

1. Follow Rails and React best practices
2. Maintain TypeScript type safety
3. Write tests for new features
4. Run code quality tools:
   - Backend: `bundle exec rubocop`

---

**Built with Ruby on Rails + React + TypeScript**
