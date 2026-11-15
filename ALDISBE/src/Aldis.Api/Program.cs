using Aldis.Api.Security;
using Aldis.Application;
using Aldis.Application.Interfaces.Services;
using Aldis.Infrastructure;
using Aldis.Persistence;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Aldis Internal Audit System API",
        Version = "v1",
        Description = "Backend API for Aldis Internal Audit System"
    });

    // Identitas sementara (belum ada login): klik "Authorize" lalu isi id user, mis. 1.
    options.AddSecurityDefinition("UserId", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Header,
        Name = HeaderCurrentUserService.HeaderName,
        Description = "Id user yang sedang bertindak (tabel users). Contoh: 1"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "UserId" }
            },
            Array.Empty<string>()
        }
    });

    // Menampilkan field input X-User-Id langsung di form parameter setiap endpoint Swagger
    options.OperationFilter<UserIdHeaderOperationFilter>();
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Clean Architecture Layer Registrations
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, HeaderCurrentUserService>();
builder.Services.AddApplication();
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddInfrastructure(
    builder.Configuration["Storage:RootPath"]
    ?? Path.Combine(builder.Environment.ContentRootPath, "App_Data", "uploads"));

var app = builder.Build();

// Automatically apply database migrations on startup
await app.Services.ApplyMigrationsAsync();

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Aldis API v1");
    options.RoutePrefix = "swagger";
});

app.MapGet("/", () => Results.Redirect("/swagger/index.html"))
   .ExcludeFromDescription();

app.UseCors("AllowAll");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
