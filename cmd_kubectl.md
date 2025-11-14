kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/db-deployment.yaml -f k8s/db-service.yaml
kubectl apply -f k8s/backend-deployment.yaml -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml -f k8s/frontend-service.yaml
kubectl apply -f k8s/phpmyadmin-deployment.yaml -f k8s/phpmyadmin-service.yaml
