import spec from "@/lib/openapi/openapi.json";

type OpenApiSpec = typeof spec;
type PathItem = OpenApiSpec["paths"][keyof OpenApiSpec["paths"]];

export type EndpointParameter = {
  name: string;
  in: string;
  required: boolean;
  schema: Record<string, unknown>;
};

export type EndpointInfo = {
  method: string;
  path: string;
  tags: string[];
  operationId: string;
  parameters: EndpointParameter[];
  hasBody: boolean;
  bodySchemaRef: string | null;
  bodySchema: Record<string, unknown> | null;
  summary: string;
};

function resolveRef(ref: string): Record<string, unknown> | null {
  // Handles $ref like "#/components/schemas/AdjustWalletDto"
  const parts = ref.replace("#/", "").split("/");
  let current: unknown = spec;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  return current as Record<string, unknown> | null;
}

function resolveParameter(
  param: Record<string, unknown>,
): EndpointParameter | null {
  if ("$ref" in param && typeof param.$ref === "string") {
    const resolved = resolveRef(param.$ref);
    if (!resolved) return null;
    return {
      name: resolved.name as string,
      in: resolved.in as string,
      required: (resolved.required as boolean) ?? false,
      schema: (resolved.schema as Record<string, unknown>) ?? {},
    };
  }
  return {
    name: param.name as string,
    in: param.in as string,
    required: (param.required as boolean) ?? false,
    schema: (param.schema as Record<string, unknown>) ?? {},
  };
}

export function getEndpoints(): EndpointInfo[] {
  const endpoints: EndpointInfo[] = [];

  for (const [path, methods] of Object.entries(spec.paths)) {
    const pathItem = methods as PathItem;
    for (const [method, operation] of Object.entries(pathItem)) {
      if (typeof operation !== "object" || operation === null) continue;

      const op = operation as Record<string, unknown>;
      const rawParams = (op.parameters as Record<string, unknown>[]) ?? [];
      const parameters = rawParams
        .map(resolveParameter)
        .filter((p): p is EndpointParameter => p !== null);

      // Resolve request body
      let hasBody = false;
      let bodySchemaRef: string | null = null;
      let bodySchema: Record<string, unknown> | null = null;

      const requestBody = op.requestBody as Record<string, unknown> | undefined;
      if (requestBody) {
        hasBody = true;
        const content = requestBody.content as Record<string, unknown>;
        const jsonContent = content?.["application/json"] as
          | Record<string, unknown>
          | undefined;
        if (jsonContent?.schema) {
          const schemaObj = jsonContent.schema as Record<string, unknown>;
          if ("$ref" in schemaObj && typeof schemaObj.$ref === "string") {
            bodySchemaRef = schemaObj.$ref;
            bodySchema = resolveRef(schemaObj.$ref);
          } else {
            bodySchema = schemaObj;
          }
        }
      }

      // Resolve response schema
      endpoints.push({
        method: method.toUpperCase(),
        path,
        tags: (op.tags as string[]) ?? [],
        operationId: (op.operationId as string) ?? "",
        parameters,
        hasBody,
        bodySchemaRef,
        bodySchema,
        summary: (op.summary as string) ?? "",
      });
    }
  }

  return endpoints;
}

export function getEndpointsByTag(): Record<string, EndpointInfo[]> {
  const endpoints = getEndpoints();
  const byTag: Record<string, EndpointInfo[]> = {};

  for (const ep of endpoints) {
    const tags = ep.tags.length > 0 ? ep.tags : ["Untagged"];
    for (const tag of tags) {
      if (!byTag[tag]) byTag[tag] = [];
      byTag[tag].push(ep);
    }
  }

  return byTag;
}

const defaultBodies: Record<string, () => object> = {
  "#/components/schemas/AdjustWalletDto": () => ({
    userId: "",
    amount: 0,
    reason: "",
  }),
  "#/components/schemas/CreateTournamentDto": () => ({
    name: "",
    startingStack: 1000,
    maxPlayers: 9,
    minPlayers: 2,
    seatMax: 9,
    buyIn: 100,
    blindStructure: [
      { level: 1, smallBlind: 10, bigBlind: 20, durationSeconds: 600 },
    ],
    registrationOpensAt: new Date().toISOString(),
    registrationClosesAt: new Date(
      Date.now() + 3600 * 1000,
    ).toISOString(),
    lateRegMinutes: 30,
    payoutStructure: [
      { place: 1, percentage: 60 },
      { place: 2, percentage: 30 },
      { place: 3, percentage: 10 },
    ],
  }),
  "#/components/schemas/TableActionDto": () => ({
    actionType: "check",
  }),
};

export function getDefaultBody(schemaRef: string): object | null {
  const factory = defaultBodies[schemaRef];
  return factory ? factory() : null;
}
