export type Donation = {
  id: string;
  donorName: string;
  amountUsd: number;
  donatedAt: string;
  organizationId: string;
  organizationName: string;
};

export const donationSeed: Donation[] = [
  {
    id: "d_1001",
    donorName: "Angela Morrison",
    amountUsd: 125,
    donatedAt: "2026-04-01T14:20:00Z",
    organizationId: "org_st_mark",
    organizationName: "St. Mark Church",
  },
  {
    id: "d_1002",
    donorName: "Evan Rivera",
    amountUsd: 45,
    donatedAt: "2026-04-02T18:05:00Z",
    organizationId: "org_st_mark",
    organizationName: "St. Mark Church",
  },
  {
    id: "d_1003",
    donorName: "Mina Patel",
    amountUsd: 210,
    donatedAt: "2026-04-02T19:41:00Z",
    organizationId: "org_grace_fellowship",
    organizationName: "Grace Fellowship",
  },
  {
    id: "d_1004",
    donorName: "Noah Lee",
    amountUsd: 80,
    donatedAt: "2026-04-03T09:11:00Z",
    organizationId: "org_st_mark",
    organizationName: "St. Mark Church",
  }
];
