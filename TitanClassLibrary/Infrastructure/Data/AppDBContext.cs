using Microsoft.EntityFrameworkCore;
using Titan_Project.Server.Domain.Model;

namespace Titan_Project.Server.Infrastructure.Data
{
    public class AppDBContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<AlcoholProduct> AlcoholProducts { get; set; }
        public DbSet<BeerProduct> BeerProducts { get; set; }


        public AppDBContext(DbContextOptions<AppDBContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. Налаштування ієрархії продуктів (Table-Per-Type)
            // Map base and derived types to separate tables (TPT)
            modelBuilder.Entity<AlcoholProduct>().ToTable("AlcoholProducts");
            modelBuilder.Entity<BeerProduct>().ToTable("BeerProducts");

            // Налаштування базових властивостей AlcoholProduct
            modelBuilder.Entity<AlcoholProduct>(entity =>
            {
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Description).HasMaxLength(2000);
                entity.Property(e => e.CountryOfOrigin).HasMaxLength(100);
                entity.Property(e => e.Price).HasPrecision(18, 2);
                entity.Property(e => e.Abv).HasPrecision(5, 2);
            });

            // Налаштування специфічних полів для пива
            modelBuilder.Entity<BeerProduct>(entity =>
            {
                entity.Property(e => e.Ibu).HasPrecision(5, 0);
                entity.Property(e => e.Srm).HasPrecision(5, 0);
                entity.Property(e => e.Color).IsRequired();
                entity.Property(e => e.Style).IsRequired(); 
            });

            // 2. Налаштування користувача (User)
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.UserId);
                entity.Property(u => u.Username).IsRequired().HasMaxLength(255);
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.PasswordHash).IsRequired();
                entity.Property(u => u.CreatedAt).ValueGeneratedOnAdd();
                entity.Property(u => u.Country).HasMaxLength(100);
                entity.Property(e => e.TargetAbv).HasPrecision(5, 2);
                entity.Property(e => e.AbvTolerance).HasPrecision(5, 2);
                entity.Property(e => e.MaxPrice).HasPrecision(18, 2);
                entity.Property(u => u.PreferredTagsJson).HasMaxLength(2000);

                // Налаштування зв'язку Many-to-Many для списку улюбленого (Favorites)
                entity.HasMany(u => u.Favorites)
                    .WithMany(p => p.Favorites)
                    .UsingEntity<Dictionary<string, object>>(
                        "UserFavorites",
                        j => j
                            .HasOne<AlcoholProduct>()
                            .WithMany()
                            .HasForeignKey("ProductId")
                            .OnDelete(DeleteBehavior.Cascade),
                        j => j
                            .HasOne<User>()
                            .WithMany()
                            .HasForeignKey("UserId")
                            .OnDelete(DeleteBehavior.Cascade),
                        j => j.HasKey("UserId", "ProductId"));            });

            // 3. Налаштування відгуків (Reviews)
            modelBuilder.Entity<Review>(entity =>
            {
                entity.Property(e => e.Comment).HasMaxLength(1000);

                // Зв'язок Відгук -> Користувач
                entity.HasOne<User>()
                      .WithMany() 
                      .HasForeignKey(r => r.UserId)
                      .OnDelete(DeleteBehavior.Cascade); // При видаленні юзера видаляються його відгуки

                // Зв'язок Відгук -> Продукт
                entity.HasOne<AlcoholProduct>()
                      .WithMany() 
                      .HasForeignKey(r => r.ProductId)
                      .OnDelete(DeleteBehavior.Cascade); // При видаленні продукту видаляються відгуки про нього
            });

        }
    }
}