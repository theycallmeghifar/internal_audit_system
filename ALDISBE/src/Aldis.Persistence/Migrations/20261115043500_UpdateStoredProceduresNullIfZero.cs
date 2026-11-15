using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aldis.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateStoredProceduresNullIfZero : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Update sp_create_user to handle 0 as NULL for department_id
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

            // 2. Update sp_create_department to handle 0 as NULL for head_user_id
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

            // 3. Update sp_create_iso_standard to handle 0 as NULL for category_id
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
        p_employee_id, p_fullname, p_nickname, p_email, p_department_id,
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
    VALUES (p_code, p_name, p_head_user_id, p_created_by, CURRENT_TIMESTAMP, true)
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Transaction failed in sp_create_department: %', SQLERRM;
END;
$$;
");

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
    VALUES (p_code, p_version, p_title, p_category_id, p_effective_date, p_created_by, CURRENT_TIMESTAMP, true)
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Transaction failed in sp_create_iso_standard: %', SQLERRM;
END;
$$;
");
        }
    }
}
