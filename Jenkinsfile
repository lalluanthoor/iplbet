pipeline {
  agent any
  stages {
    stage('NPM Dependencies') {
      steps {
        sh 'npm install'
      }
    }
    stage('Run') {
      steps {
        sh 'npm start'
      }
    }
  }
}
