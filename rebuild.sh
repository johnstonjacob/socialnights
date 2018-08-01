if [ "$1" == "client" ]; then
	echo "Rebuilding client files and restarting container..!"
    npm run build && docker stop socialnights && docker rm socialnights && docker build -t socialnights . && docker run --name socialnights --network br0 -d socialnights 
elif [ "$1" == "nocontainer" ]; then
    echo "Starting new container.."
    docker build -t socialnights . && docker run --name socialnights --network br0 -d socialnights
else
	echo "Restarting container..!"
    docker stop socialnights && docker rm socialnights && docker build -t socialnights . && docker run --name socialnights --network br0 -d socialnights
fi
