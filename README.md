# lomap_en2b

[![Actions Status](https://github.com/arquisoft/lomap_en2b/workflows/CI%20for%20LOMAP_EN2B/badge.svg)](https://github.com/arquisoft/lomap_en2b/actions)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_lomap_en2b&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Arquisoft_lomap_en2b)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_lomap_en2b&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Arquisoft_lomap_en2b)

## Team members

Pedro Limeres Granado uo282763@uniovi.es  

## Important message
This project is intented to work on two ways, deployed and on a pc locally, so in order to make it possible I just made a few changes on the code and now you will be able to run the app correctly on the main branch 😊😊

## Introduction to Lomap

This is an application done by a team of UniOvi students, which evolved to being the redo of that application by one student simulating the project done by a belgian software company, for the Council of Brussels. 💻💻
It is an application where the users can login with their Solid accounts and share their favourite landmarks and places all around the globe with their friends. In the application you will be able to see your friends' landmarks, and you can create landmarks on your favourite places in order to let people see what you enjoy the most about the city of Brussels and also from the whole world. 🌍🌍

This is a website done while we learnt some technologies like **React**, **Typescript** or an endpoint using **NodeJS** with **express**.  🧐🤓

<p align="center">
<img src="https://blog.wildix.com/wp-content/uploads/2020/06/react-logo.jpg" height="100">
<img src="https://miro.medium.com/max/1200/0*RbmfNyhuBb8G3LWh.png" height="100">
<img src="https://miro.medium.com/max/365/1*Jr3NFSKTfQWRUyjblBSKeg.png" height="100">
</p>

## Quickstart guide

### Requirements

* [Git](https://git-scm.com/downloads)
*  [Node.js](https://nodejs.org). If you are interested in using several versions at the same time, you should consider a version manager, such as [NVM](https://github.com/nvm-sh/nvm).
* [Docker](https://docs.docker.com/get-docker/) (optionally)

Download the project with :
```bash
git clone https://github.com/plg22/lomap_en2b
```

For running it, compile and run the restapi, starting from the base folder:
```shell
cd restapi
npm i
npm run dev
```

Now the webapp:

```shell
cd webapp
npm i
npm start
```

This runs the application in local, take into account you must have nodejs installed in the system.
You should be able to access the application in [http://localhost:3000](http://localhost:3000).
