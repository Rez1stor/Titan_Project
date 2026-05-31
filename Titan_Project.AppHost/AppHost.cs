var builder = DistributedApplication.CreateBuilder(args);

var server = builder.AddProject<Projects.Titan_Project_Server>("server")
    .WithHttpHealthCheck("/health")
    .WithExternalHttpEndpoints();

var webfrontend = builder.AddViteApp("webfrontend", "../frontend")
    .WithHttpEndpoint(port: 5173, name: "vite")
    .WithReference(server)
    .WaitFor(server);

server.PublishWithContainerFiles(webfrontend, "wwwroot");

builder.Build().Run();
