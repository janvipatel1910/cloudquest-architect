# ☁️ CloudQuest Architect

CloudQuest Architect is an interactive AWS architecture learning platform that helps learners practise cloud design through realistic client scenarios.

Instead of only reading AWS theory, learners make architecture decisions, unlock clues, build a solution, pass an architect review, complete deployment checks, and earn XP.

## 🚀 Live Demo

CloudQuest Architect is deployed on AWS EC2:

http://51.20.6.21:8002/

## 🎯 Project Goal

The project was created to provide hands-on AWS architecture practice through scenario-based learning.

Each mission follows this learning flow:

**Solve → Unlock Clues → Build Architecture → Architect Review → Deploy → Validate → Complete Mission**

## 🎮 Available Missions

### Mission 01 — Launch Day

**Client:** NovaLaunch

Design a secure, highly available and low-maintenance static website architecture.

AWS services and concepts include:

- Amazon S3
- Amazon CloudFront
- AWS Certificate Manager (ACM)
- Amazon Route 53
- HTTPS
- Private origin design
- Global content delivery

### Mission 02 — Traffic Surge

**Client:** ShopWave

Design an architecture for an online retailer preparing for a major increase in customer traffic.

AWS services and concepts include:

- Application Load Balancer
- Amazon EC2
- EC2 Auto Scaling
- Multi-AZ application capacity
- Amazon RDS
- Security Groups
- High availability and scaling

## ✨ Features

- Scenario-based AWS architecture missions
- Multiple-choice architecture decisions
- Progressive clue unlocking
- Interactive architecture board
- Architecture validation
- Deployment verification stages
- Mission completion tracking
- XP progression
- Browser persistence using localStorage
- Multiple mission support

## 🛠️ Technology Stack

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic

### Frontend

- HTML
- CSS
- JavaScript

### AWS & Deployment

- Amazon EC2
- Linux
- systemd
- GitHub
- Git

## 🏗️ Application Architecture

The browser loads the CloudQuest frontend from the FastAPI application running on Amazon EC2.

The frontend communicates with FastAPI endpoints for mission questions, progress tracking, architecture validation, and mission logic.

FastAPI also serves the static frontend files, allowing the application and API to run from the same deployment.

```text
User
  |
  v
Amazon EC2
  |
  +-- FastAPI / Uvicorn
       |
       +-- REST API
       |
       +-- HTML / CSS / JavaScript
       |
       +-- Mission Engine
             |
             +-- Mission 01
             +-- Mission 02
⚙️ Deployment

CloudQuest Architect is deployed on an Ubuntu EC2 instance.

The FastAPI application runs as a systemd service so that:

the application continues running after the SSH session closes
the service automatically starts with the server
the application can automatically restart after a process failure
📚 What I Learned

Building CloudQuest Architect provided practical experience with:

Designing AWS architectures from business requirements
Building REST APIs with FastAPI
Creating reusable mission logic
Connecting a JavaScript frontend to backend APIs
Managing application state
Deploying a Python web application to Amazon EC2
Configuring Linux services with systemd
Troubleshooting networking and security group access
Using Git and GitHub for version control
🔮 Future Development

Potential future versions may include additional AWS, DevOps, Python and role-based practical learning missions.

👩‍💻 Author

Janvi Patel

Built as a hands-on cloud engineering and AWS architecture portfolio project.
