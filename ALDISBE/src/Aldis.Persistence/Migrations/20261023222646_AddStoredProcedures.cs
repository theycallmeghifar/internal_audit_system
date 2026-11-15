using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aldis.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStoredProcedures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. User Stored Procedures
            migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION sp_create_user(
    p_employee_id VARCHAR,
    p_fullname VARCHAR,
    p_nickname VARCHAR,
    p_email VARCHAR,
    p_department_id INT,
    p_job_level VARCHAR,
    p_job_title VARCHAR,
    p_role VARCHAR,
    p_created_by VARCHAR
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_id INT;
BEGIN
    INSERT INTO users (
        employee_id, fullname, nickname, email, department_id,
        job_level, job_title, role, created_by, created_date, is_active
    )
    VALUES (
        p_employee_id, p_fullname, p_nickname, p_email, NULLIF(p_department_id, 0),
        p_job_level, p_job_title, p_role, p_created_by, CURRENT_TIMESTAMP, true
    )
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Transaction failed in sp_create_user: %', SQLERRM;
END;
$$;
");

            migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION sp_get_users()
RETURNS TABLE (
    id INT,
    employee_id VARCHAR,
    fullname VARCHAR,
    nickname VARCHAR,
    email VARCHAR,
    department_id INT,
    department_name VARCHAR,
    job_level VARCHAR,
    job_title VARCHAR,
    role VARCHAR,
    created_by VARCHAR,
    created_date TIMESTAMP,
    update_by VARCHAR,
    update_date TIMESTAMP,
    is_active BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.employee_id,
        u.fullname,
        u.nickname,
        u.email,
        u.department_id,
        d.name AS department_name,
        u.job_level,
        u.job_title,
        u.role,
        u.created_by,
        u.created_date,
        u.update_by,
        u.update_date,
        u.is_active
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.is_active = true
    ORDER BY u.id DESC;
END;
$$;
");

            // 2. Department Stored Procedures
            migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION sp_create_department(
    p_code VARCHAR,
    p_name VARCHAR,
    p_head_user_id INT,
    p_created_by VARCHAR
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_id INT;
BEGIN
    INSERT INTO departments (code, name, head_user_id, created_by, created_date, is_active)
    VALUES (p_code, p_name, NULLIF(p_head_user_id, 0), p_created_by, CURRENT_TIMESTAMP, true)
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Transaction failed in sp_create_department: %', SQLERRM;
END;
$$;
");

            migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION sp_get_departments()
RETURNS TABLE (
    id INT,
    code VARCHAR,
    name VARCHAR,
    head_user_id INT,
    head_user_name VARCHAR,
    head_user_email VARCHAR,
    created_by VARCHAR,
    created_date TIMESTAMP,
    update_by VARCHAR,
    update_date TIMESTAMP,
    is_active BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.code,
        d.name,
        d.head_user_id,
        u.fullname AS head_user_name,
        u.email AS head_user_email,
        d.created_by,
        d.created_date,
        d.update_by,
        d.update_date,
        d.is_active
    FROM departments d
    LEFT JOIN users u ON d.head_user_id = u.id
    WHERE d.is_active = true
    ORDER BY d.id DESC;
END;
$$;
");

            // 3. IsoCategory Stored Procedures
            migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION sp_create_iso_category(
    p_name VARCHAR,
    p_created_by VARCHAR
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_id INT;
BEGIN
    INSERT INTO iso_categories (name, created_by, created_date, is_active)
    VALUES (p_name, p_created_by, CURRENT_TIMESTAMP, true)
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Transaction failed in sp_create_iso_category: %', SQLERRM;
END;
$$;
");

            migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION sp_get_iso_categories()
RETURNS TABLE (
    id INT,
    name VARCHAR,
    created_by VARCHAR,
    created_date TIMESTAMP,
    update_by VARCHAR,
    update_date TIMESTAMP,
    is_active BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.created_by,
        c.created_date,
        c.update_by,
        c.update_date,
        c.is_active
    FROM iso_categories c
    WHERE c.is_active = true
    ORDER BY c.id DESC;
END;
$$;
");

            // 4. IsoStandard Stored Procedures
            migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION sp_create_iso_standard(
    p_code VARCHAR,
    p_version VARCHAR,
    p_title VARCHAR,
    p_category_id INT,
    p_effective_date DATE,
    p_created_by VARCHAR
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_id INT;
BEGIN
    INSERT INTO iso_standards (code, version, title, category_id, effective_date, created_by, created_date, is_active)
    VALUES (p_code, p_version, p_title, NULLIF(p_category_id, 0), p_effective_date, p_created_by, CURRENT_TIMESTAMP, true)
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Transaction failed in sp_create_iso_standard: %', SQLERRM;
END;
$$;
");

            migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION sp_get_iso_standards()
RETURNS TABLE (
    id INT,
    code VARCHAR,
    version VARCHAR,
    title VARCHAR,
    category_id INT,
    category_name VARCHAR,
    effective_date DATE,
    created_by VARCHAR,
    created_date TIMESTAMP,
    update_by VARCHAR,
    update_date TIMESTAMP,
    is_active BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.code,
        s.version,
        s.title,
        s.category_id,
        c.name AS category_name,
        s.effective_date,
        s.created_by,
        s.created_date,
        s.update_by,
        s.update_date,
        s.is_active
    FROM iso_standards s
    LEFT JOIN iso_categories c ON s.category_id = c.id
    WHERE s.is_active = true
    ORDER BY s.id DESC;
END;
$$;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS sp_create_user(VARCHAR, VARCHAR, VARCHAR, VARCHAR, INT, VARCHAR, VARCHAR, VARCHAR, VARCHAR);");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS sp_get_users();");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS sp_create_department(VARCHAR, VARCHAR, INT, VARCHAR);");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS sp_get_departments();");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS sp_create_iso_category(VARCHAR, VARCHAR);");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS sp_get_iso_categories();");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS sp_create_iso_standard(VARCHAR, VARCHAR, VARCHAR, INT, DATE, VARCHAR);");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS sp_get_iso_standards();");
        }
    }
}
