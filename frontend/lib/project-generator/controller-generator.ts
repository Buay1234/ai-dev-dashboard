import type { EntityDefinition, EntityField, GeneratedSourceFile } from "./types";
import { PROJECT_NAMESPACE } from "./types";

function editableFields(entity: EntityDefinition) {
  return entity.fields.filter((f) => !f.isKey && f.name !== "CreatedAt" && f.name !== "UpdatedAt");
}

function dtoPropertyInitializer(field: EntityField): string {
  if (field.csharpType.startsWith("string") && field.isRequired) {
    return " = string.Empty;";
  }
  if (field.csharpType === "Guid" && field.isRequired) {
    return " = Guid.Empty;";
  }
  return "";
}

function assignInCreateInitializer(field: EntityField): string {
  const prop = field.name;
  if (field.csharpType === "Guid" && field.isRequired) {
    return `            ${prop} = this.${prop} ?? Guid.Empty,`;
  }
  return `            ${prop} = this.${prop},`;
}

function assignOnUpdate(field: EntityField): string {
  const lhs = `entity.${field.name}`;
  const rhs = `this.${field.name}`;
  if (field.csharpType === "Guid" && field.isRequired) {
    return `        ${lhs} = ${rhs} ?? Guid.Empty;`;
  }
  if (field.csharpType.endsWith("?") || !field.isRequired) {
    return `        if (${rhs} is not null) ${lhs} = ${rhs};`;
  }
  return `        ${lhs} = ${rhs};`;
}

export function generateCrudControllers(
  entities: EntityDefinition[]
): GeneratedSourceFile[] {
  return entities.map((entity) => {
    const content = `using System.Linq;
using Microsoft.AspNetCore.Mvc;
using ${PROJECT_NAMESPACE}.Application.DTOs;
using ${PROJECT_NAMESPACE}.Domain.Entities;
using ${PROJECT_NAMESPACE}.Infrastructure.Repositories;

namespace ${PROJECT_NAMESPACE}.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ${entity.name}Controller : ControllerBase
{
    private readonly I${entity.name}Repository _repository;

    public ${entity.name}Controller(I${entity.name}Repository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<${entity.name}Response>>> GetAll(CancellationToken cancellationToken)
    {
        var items = await _repository.GetAllAsync(cancellationToken);
        return Ok(items.Select(${entity.name}Response.FromEntity));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<${entity.name}Response>> GetById(int id, CancellationToken cancellationToken)
    {
        var item = await _repository.GetByIdAsync(id, cancellationToken);
        if (item is null) return NotFound();
        return Ok(${entity.name}Response.FromEntity(item));
    }

    [HttpPost]
    public async Task<ActionResult<${entity.name}Response>> Create([FromBody] ${entity.name}CreateRequest request, CancellationToken cancellationToken)
    {
        var entity = request.ToEntity();
        var created = await _repository.AddAsync(entity, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ${entity.name}Response.FromEntity(created));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ${entity.name}UpdateRequest request, CancellationToken cancellationToken)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing is null) return NotFound();
        request.Apply(existing);
        await _repository.UpdateAsync(existing, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing is null) return NotFound();
        await _repository.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
`;

    return {
      id: `controller-${entity.name}`,
      path: `${PROJECT_NAMESPACE}.API/Controllers`,
      fileName: `${entity.name}Controller.cs`,
      category: "controller",
      agent: "Nami",
      language: "csharp",
      content,
    };
  });
}

export function generateDtoFiles(
  entities: EntityDefinition[]
): GeneratedSourceFile[] {
  const files: GeneratedSourceFile[] = [];

  for (const entity of entities) {
    const editable = editableFields(entity);

    const responseProps = entity.fields
      .map(
        (f) =>
          `    public ${f.csharpType} ${f.name} { get; set; }${dtoPropertyInitializer(f)}`
      )
      .join("\n");

    const responseMap = entity.fields
      .map((f) => `            ${f.name} = entity.${f.name},`)
      .join("\n");

    const response = `using ${PROJECT_NAMESPACE}.Domain.Entities;

namespace ${PROJECT_NAMESPACE}.Application.DTOs;

public class ${entity.name}Response
{
${responseProps}

    public static ${entity.name}Response FromEntity(${entity.name} entity) => new()
    {
${responseMap}
    };
}
`;

    const createProps = editable
      .map(
        (f) =>
          `    public ${f.csharpType} ${f.name} { get; set; }${dtoPropertyInitializer(f)}`
      )
      .join("\n");

    const createAssign = editable.map(assignInCreateInitializer).join("\n");

    const create = `using System;
using ${PROJECT_NAMESPACE}.Domain.Entities;

namespace ${PROJECT_NAMESPACE}.Application.DTOs;

public class ${entity.name}CreateRequest
{
${createProps}

    public ${entity.name} ToEntity() => new()
    {
${createAssign}
    };
}
`;

    const updateProps = editable
      .map(
        (f) =>
          `    public ${f.csharpType} ${f.name} { get; set; }${dtoPropertyInitializer(f)}`
      )
      .join("\n");

    const updateAssign = editable.map(assignOnUpdate).join("\n");

    const update = `using System;
using ${PROJECT_NAMESPACE}.Domain.Entities;

namespace ${PROJECT_NAMESPACE}.Application.DTOs;

public class ${entity.name}UpdateRequest
{
${updateProps}

    public void Apply(${entity.name} entity)
    {
${updateAssign}
    }
}
`;

    files.push({
      id: `dto-response-${entity.name}`,
      path: `${PROJECT_NAMESPACE}.Application/DTOs`,
      fileName: `${entity.name}Response.cs`,
      category: "controller",
      agent: "Nami",
      language: "csharp",
      content: response,
    });

    files.push({
      id: `dto-create-${entity.name}`,
      path: `${PROJECT_NAMESPACE}.Application/DTOs`,
      fileName: `${entity.name}CreateRequest.cs`,
      category: "controller",
      agent: "Nami",
      language: "csharp",
      content: create,
    });

    files.push({
      id: `dto-update-${entity.name}`,
      path: `${PROJECT_NAMESPACE}.Application/DTOs`,
      fileName: `${entity.name}UpdateRequest.cs`,
      category: "controller",
      agent: "Nami",
      language: "csharp",
      content: update,
    });
  }

  return files;
}

export function generateHealthControllers(): GeneratedSourceFile[] {
  const weatherForecast = `using System.Linq;
using Microsoft.AspNetCore.Mvc;

namespace ${PROJECT_NAMESPACE}.API.Controllers;

[ApiController]
[Route("[controller]")]
public class WeatherForecastController : ControllerBase
{
    private static readonly string[] Summaries =
    {
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    };

    [HttpGet]
    public IEnumerable<WeatherForecast> Get()
    {
        return Enumerable.Range(1, 5).Select(index => new WeatherForecast
        {
            Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = Summaries[Random.Shared.Next(Summaries.Length)]
        });
    }
}

public class WeatherForecast
{
    public DateOnly Date { get; set; }
    public int TemperatureC { get; set; }
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
    public string? Summary { get; set; }
}
`;

  return [
    {
      id: "health-weatherforecast",
      path: `${PROJECT_NAMESPACE}.API/Controllers`,
      fileName: "WeatherForecastController.cs",
      category: "controller",
      agent: "Franky",
      language: "csharp",
      content: weatherForecast,
    },
  ];
}
