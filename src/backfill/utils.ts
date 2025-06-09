import { plcDirectoryLimiter } from "./rateLimit.js"; // Import the new limiter

export const getPDS = async (did: string): Promise<string | null> => {
  const res = await plcDirectoryLimiter(() =>
    fetch(`https://plc.directory/${did}`),
  );
  if (!res.ok) throw new Error("PDS not found");
  const pds = (await res.json()) as {
    service: {
      id: string;
      type: string;
      serviceEndpoint: string;
    }[];
  };
  const service = pds.service.find((x) => x.id === "#atproto_pds");
  if (!service) throw new Error("PDS not found");
  return service.serviceEndpoint;
};
