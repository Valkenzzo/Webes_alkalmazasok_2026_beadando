using ExpenseTracker.Api.Application.Transactions;
using ExpenseTracker.Api.Controllers.Contracts;
using ExpenseTracker.Api.Controllers.Mapping;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/transactions")]
[Produces("application/json")]
public sealed class TransactionsController(ITransactionService transactionService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<TransactionResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TransactionResponse>>> Get(CancellationToken cancellationToken)
    {
        var transactions = await transactionService.ListTransactionsAsync(cancellationToken);
        var response = transactions.Select(TransactionMapping.ToResponse).ToArray();
        return Ok(response);
    }
}