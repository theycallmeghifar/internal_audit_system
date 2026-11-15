using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aldis.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixIsoStandardEffectiveDateType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Overload sp_create_iso_standard to accept TIMESTAMP WITHOUT TIME ZONE
            migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION sp_create_iso_standard(
    p_code VARCHAR,
    p_version VARCHAR,
    p_title VARCHAR,
    p_category_id INT,
    p_effective_date TIMESTAMP,
    p_created_by VARCHAR
)
RETURNS INT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN sp_create_iso_standard(
        p_code,
        p_version,
        p_title,
        p_category_id,
        p_effective_date::DATE,
        p_created_by
    );
END;
$$;
");

            // 2. Overload sp_create_iso_standard to accept TIMESTAMPTZ
            migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION sp_create_iso_standard(
    p_code VARCHAR,
    p_version VARCHAR,
    p_title VARCHAR,
    p_category_id INT,
    p_effective_date TIMESTAMPTZ,
    p_created_by VARCHAR
)
RETURNS INT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN sp_create_iso_standard(
        p_code,
        p_version,
        p_title,
        p_category_id,
        p_effective_date::DATE,
        p_created_by
    );
END;
$$;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS sp_create_iso_standard(VARCHAR, VARCHAR, VARCHAR, INT, TIMESTAMP, VARCHAR);");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS sp_create_iso_standard(VARCHAR, VARCHAR, VARCHAR, INT, TIMESTAMPTZ, VARCHAR);");
        }
    }
}
