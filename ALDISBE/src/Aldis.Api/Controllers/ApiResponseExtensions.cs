using Aldis.Contracts.Common;
using Microsoft.AspNetCore.Mvc;

namespace Aldis.Api.Controllers;

public static class ApiResponseExtensions
{
    /// <summary>Memetakan <see cref="ApiResponse{T}.ErrorCode"/> ke HTTP status code.</summary>
    public static ActionResult ToActionResult<T>(this ControllerBase controller, ApiResponse<T> response)
    {
        if (response.Success)
            return controller.Ok(response);

        return response.ErrorCode switch
        {
            ApiErrorCodes.Unauthorized => controller.StatusCode(StatusCodes.Status401Unauthorized, response),
            ApiErrorCodes.Forbidden => controller.StatusCode(StatusCodes.Status403Forbidden, response),
            ApiErrorCodes.NotFound => controller.NotFound(response),
            ApiErrorCodes.Conflict => controller.Conflict(response),
            _ => controller.BadRequest(response)
        };
    }
}
