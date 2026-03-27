using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using SesizariGalatiAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. ADD DATABASE CONTEXT (Supabase)
builder.Services.AddDbContext<SesizariGalatiDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("SupabaseConnection")));

// 2. ADD MEMORY CACHE (For OTP Codes in AuthController)
builder.Services.AddMemoryCache();

// 3. ADD CORS (Allows Frontend Next.js to communicate without blocking)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policyBuilder =>
    {
        policyBuilder.AllowAnyOrigin()
                     .AllowAnyMethod()
                     .AllowAnyHeader();
    });
});

// 4. ADD CONTROLLERS
builder.Services.AddControllers();

// 5. CONFIGURE JWT AUTHENTICATION
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(secretKey)
    };
});

// 6. CONFIGURE SWAGGER (With JWT Bearer Support)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Sesizari Galati API", Version = "v1" });

    // Define the Bearer token security scheme
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = @"Introdu token-ul JWT obținut la login. 
                      Exemplu: 'Bearer eyJhbG...'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    // Apply the scheme globally
    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

var app = builder.Build();

// ==========================================
// CONFIGURE THE HTTP REQUEST PIPELINE
// ==========================================

// Enable Swagger UI
app.UseSwagger();
app.UseSwaggerUI(c => 
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Sesizari Galati API v1");
    // Ca sa se deschida Swagger direct pe ruta principala (daca vrei)
    // c.RoutePrefix = string.Empty; 
});

// VERY IMPORTANT: Middleware order matters!
// Serve static files (like uploaded images) from wwwroot
app.UseStaticFiles();

app.UseCors("AllowAll");        // 1. Check CORS headers first
app.UseAuthentication();        // 2. Who are you? (Validates JWT)
app.UseAuthorization();         // 3. Are you allowed here? (Validates [Authorize])

app.MapControllers();           // 4. Route to the correct Controller

// Ensure ABUSE_REPORT table exists
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<SesizariGalatiAPI.Data.SesizariGalatiDbContext>();
    dbContext.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""ABUSE_REPORT"" (
            id_abuse SERIAL PRIMARY KEY,
            id_report INTEGER NOT NULL,
            id_user INTEGER NOT NULL,
            reason TEXT NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT fk_abuse_report FOREIGN KEY (id_report) REFERENCES ""REPORT"" (id_report) ON DELETE CASCADE,
            CONSTRAINT fk_abuse_user FOREIGN KEY (id_user) REFERENCES ""USER"" (id_user) ON DELETE CASCADE,
            CONSTRAINT unique_abuse_per_user UNIQUE (id_report, id_user)
        );
    ");
}

// Ensure is_resolved column exists on ABUSE_REPORT
using (var scope2 = app.Services.CreateScope())
{
    var dbContext2 = scope2.ServiceProvider.GetRequiredService<SesizariGalatiAPI.Data.SesizariGalatiDbContext>();
    dbContext2.Database.ExecuteSqlRaw(@"
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'ABUSE_REPORT' AND column_name = 'is_resolved'
            ) THEN
                ALTER TABLE ""ABUSE_REPORT"" ADD COLUMN is_resolved BOOLEAN NOT NULL DEFAULT FALSE;
            END IF;
        END $$;
    ");
}

// Asculta pe portul mașinii virtuale (ex: 5000)
app.Run("http://0.0.0.0:5000");