using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Aldis.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditWorkflowColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeOnly>(
                name: "audit_time",
                table: "audit_headers",
                type: "time without time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "started_by",
                table: "audit_headers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "started_date",
                table: "audit_headers",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "review_decision",
                table: "audit_details",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "reviewed_by",
                table: "audit_details",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "reviewed_date",
                table: "audit_details",
                type: "timestamp without time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "audit_time", table: "audit_headers");
            migrationBuilder.DropColumn(name: "started_by", table: "audit_headers");
            migrationBuilder.DropColumn(name: "started_date", table: "audit_headers");
            migrationBuilder.DropColumn(name: "review_decision", table: "audit_details");
            migrationBuilder.DropColumn(name: "reviewed_by", table: "audit_details");
            migrationBuilder.DropColumn(name: "reviewed_date", table: "audit_details");
        }
    }
}
