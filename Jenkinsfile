pipeline {
    agent any
    environment {
        ECR_REPO = "058264264060.dkr.ecr.us-east-1.amazonaws.com/fingertips-backend"
        SERVICE_NAME = "fingertips-backend"
        STACK_NAME = "fingertips-stack"
    }
    stages {
        stage("Docker Build") {
            steps {
                sh "docker build -t 058264264060.dkr.ecr.us-east-1.amazonaws.com/fingertips-backend:fingertips-backend-${BUILD_NUMBER} ."
            }
        }
        stage("ECR Push") {
            steps {
                sh "docker login -u AWS -p \$(aws ecr get-login-password --region us-east-1) 058264264060.dkr.ecr.us-east-1.amazonaws.com/fingertips-backend"
                sh "docker push 058264264060.dkr.ecr.us-east-1.amazonaws.com/fingertips-backend:fingertips-backend-${BUILD_NUMBER}"
                
            }
        }       
        stage("Docker Swarm Deployment") {
            steps {
                script {
                    def serviceExists = sh(script: "docker service ls --filter name=${SERVICE_NAME} | wc -l", returnStdout: true).trim()
                    if (serviceExists.toInteger() > 1) {
                        // Service already exists, update it to new code
                        sh "docker service update --image ${ECR_REPO}:fingertips-backend-${BUILD_NUMBER} ${SERVICE_NAME}"
                    } else {
                        // Service doesn't exist, create it
                        sh "docker volume create company-images"
                        sh "docker volume create professional-images"
                        sh "docker service create --name ${SERVICE_NAME} --replicas 1 --publish published=3001,target=3001 --mount source=company-images,target=/usr/src/app/company-images --mount source=professional-images,target=/usr/src/app/professional-images ${ECR_REPO}:fingertips-backend-${BUILD_NUMBER}"
                    }
                }
            }
        }      
    } 
}
