import { describe, it, expect, beforeEach } from "vitest";
import { stringAsciiCV, stringUtf8CV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_DEED_NOT_FOUND = 101;
const ERR_INVALID_METAVERSE_ID = 102;
const ERR_INVALID_COORDINATES = 103;
const ERR_INVALID_TITLE = 104;
const ERR_INVALID_DESCRIPTION = 105;
const ERR_INVALID_ATTRIBUTES = 106;
const ERR_DEED_ALREADY_EXISTS = 107;
const ERR_MAX_DEEDS_EXCEEDED = 109;
const ERR_INVALID_UPDATE_PARAM = 112;
const ERR_AUTHORITY_NOT_VERIFIED = 111;
const ERR_INVALID_LOCATION = 115;
const ERR_INVALID_DIMENSIONS = 116;
const ERR_INVALID_VALUE = 117;
const ERR_INVALID_ROYALTY_RATE = 118;
const ERR_INVALID_GRACE_PERIOD = 119;

interface Deed {
  owner: string;
  metaverseId: string;
  coordinates: string;
  title: string;
  description: string;
  attributes: string;
  location: string;
  dimensions: string;
  value: number;
  royaltyRate: number;
  royaltyReceiver: string;
  timestamp: number;
  status: boolean;
  gracePeriod: number;
}

interface DeedUpdate {
  updateTitle: string;
  updateDescription: string;
  updateAttributes: string;
  updateTimestamp: number;
  updater: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class NFTDeedMock {
  state: {
    lastDeedId: number;
    maxDeeds: number;
    mintFee: number;
    authorityContract: string | null;
    deeds: Map<number, Deed>;
    deedUpdates: Map<number, DeedUpdate>;
    deedsByCoordinates: Map<string, number>;
  } = {
    lastDeedId: 0,
    maxDeeds: 10000,
    mintFee: 500,
    authorityContract: null,
    deeds: new Map(),
    deedUpdates: new Map(),
    deedsByCoordinates: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  stxTransfers: Array<{ amount: number; from: string; to: string | null }> = [];
  landRegistry: { verifyLand: (metaverseId: string, coordinates: string) => Result<boolean> } = {
    verifyLand: () => ({ ok: true, value: true }),
  };

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      lastDeedId: 0,
      maxDeeds: 10000,
      mintFee: 500,
      authorityContract: null,
      deeds: new Map(),
      deedUpdates: new Map(),
      deedsByCoordinates: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.stxTransfers = [];
    this.landRegistry = {
      verifyLand: () => ({ ok: true, value: true }),
    };
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === "SP000000000000000000002Q6VF78") {
      return { ok: false, value: false };
    }
    if (this.state.authorityContract !== null) {
      return { ok: false, value: false };
    }
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setMintFee(newFee: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    this.state.mintFee = newFee;
    return { ok: true, value: true };
  }

  setMaxDeeds(newMax: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    this.state.maxDeeds = newMax;
    return { ok: true, value: true };
  }

  mintDeed(
    metaverseId: string,
    coordinates: string,
    title: string,
    description: string,
    attributes: string,
    location: string,
    dimensions: string,
    value: number,
    royaltyRate: number,
    royaltyReceiver: string,
    gracePeriod: number
  ): Result<number> {
    if (this.state.lastDeedId >= this.state.maxDeeds) return { ok: false, value: ERR_MAX_DEEDS_EXCEEDED };
    if (!metaverseId || metaverseId.length > 50) return { ok: false, value: ERR_INVALID_METAVERSE_ID };
    if (!coordinates || coordinates.length > 100) return { ok: false, value: ERR_INVALID_COORDINATES };
    if (!title || title.length > 100) return { ok: false, value: ERR_INVALID_TITLE };
    if (description.length > 500) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    if (attributes.length > 200) return { ok: false, value: ERR_INVALID_ATTRIBUTES };
    if (location.length > 100) return { ok: false, value: ERR_INVALID_LOCATION };
    if (dimensions.length > 50) return { ok: false, value: ERR_INVALID_DIMENSIONS };
    if (value <= 0) return { ok: false, value: ERR_INVALID_VALUE };
    if (royaltyRate > 10) return { ok: false, value: ERR_INVALID_ROYALTY_RATE };
    if (gracePeriod > 30) return { ok: false, value: ERR_INVALID_GRACE_PERIOD };
    if (royaltyReceiver === "SP000000000000000000002Q6VF78") return { ok: false, value: ERR_NOT_AUTHORIZED };
    const coordKey = `${metaverseId}|${coordinates}`;
    if (this.state.deedsByCoordinates.has(coordKey)) return { ok: false, value: ERR_DEED_ALREADY_EXISTS };
    const verify = this.landRegistry.verifyLand(metaverseId, coordinates);
    if (!verify.ok) return { ok: false, value: verify.value as number };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };

    this.stxTransfers.push({ amount: this.state.mintFee, from: this.caller, to: this.state.authorityContract });

    const id = this.state.lastDeedId + 1;
    const deed: Deed = {
      owner: this.caller,
      metaverseId,
      coordinates,
      title,
      description,
      attributes,
      location,
      dimensions,
      value,
      royaltyRate,
      royaltyReceiver,
      timestamp: this.blockHeight,
      status: true,
      gracePeriod,
    };
    this.state.deeds.set(id, deed);
    this.state.deedsByCoordinates.set(coordKey, id);
    this.state.lastDeedId = id;
    return { ok: true, value: id };
  }

  transferDeed(id: number, newOwner: string): Result<boolean> {
    const deed = this.state.deeds.get(id);
    if (!deed) return { ok: false, value: ERR_DEED_NOT_FOUND };
    if (deed.owner !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    deed.owner = newOwner;
    this.state.deeds.set(id, deed);
    return { ok: true, value: true };
  }

  updateDeed(id: number, updateTitle: string, updateDescription: string, updateAttributes: string): Result<boolean> {
    const deed = this.state.deeds.get(id);
    if (!deed) return { ok: false, value: ERR_DEED_NOT_FOUND };
    if (deed.owner !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (!updateTitle || updateTitle.length > 100) return { ok: false, value: ERR_INVALID_TITLE };
    if (updateDescription.length > 500) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    if (updateAttributes.length > 200) return { ok: false, value: ERR_INVALID_ATTRIBUTES };

    const updated: Deed = {
      ...deed,
      title: updateTitle,
      description: updateDescription,
      attributes: updateAttributes,
      timestamp: this.blockHeight,
    };
    this.state.deeds.set(id, updated);
    this.state.deedUpdates.set(id, {
      updateTitle,
      updateDescription,
      updateAttributes,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    return { ok: true, value: true };
  }

  burnDeed(id: number): Result<boolean> {
    const deed = this.state.deeds.get(id);
    if (!deed) return { ok: false, value: ERR_DEED_NOT_FOUND };
    if (deed.owner !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    const coordKey = `${deed.metaverseId}|${deed.coordinates}`;
    this.state.deeds.delete(id);
    this.state.deedsByCoordinates.delete(coordKey);
    this.state.deedUpdates.delete(id);
    return { ok: true, value: true };
  }

  getDeedOwner(id: number): Result<string> {
    const deed = this.state.deeds.get(id);
    if (!deed) return { ok: false, value: "" };
    return { ok: true, value: deed.owner };
  }

  getDeedCount(): Result<number> {
    return { ok: true, value: this.state.lastDeedId };
  }

  checkDeedExistence(metaverseId: string, coordinates: string): Result<boolean> {
    const coordKey = `${metaverseId}|${coordinates}`;
    return { ok: true, value: this.state.deedsByCoordinates.has(coordKey) };
  }
}

describe("NFTDeed", () => {
  let contract: NFTDeedMock;

  beforeEach(() => {
    contract = new NFTDeedMock();
    contract.reset();
  });

  it("mints a deed successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.mintDeed(
      "Meta1",
      "10,20",
      "Land1",
      "Desc1",
      "Attr1",
      "Loc1",
      "50x50",
      1000,
      5,
      "ST3ROYALTY",
      10
    );
    expect(result.ok).toBe(true);
    expect(result.value).toBe(1);
    const owner = contract.getDeedOwner(1);
    expect(owner.value).toBe("ST1TEST");
    expect(contract.stxTransfers).toEqual([{ amount: 500, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("rejects duplicate deeds", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.mintDeed(
      "Meta1",
      "10,20",
      "Land1",
      "Desc1",
      "Attr1",
      "Loc1",
      "50x50",
      1000,
      5,
      "ST3ROYALTY",
      10
    );
    const result = contract.mintDeed(
      "Meta1",
      "10,20",
      "Land2",
      "Desc2",
      "Attr2",
      "Loc2",
      "60x60",
      2000,
      6,
      "ST4ROYALTY",
      15
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_DEED_ALREADY_EXISTS);
  });

  it("rejects mint without authority", () => {
    const result = contract.mintDeed(
      "Meta1",
      "10,20",
      "Land1",
      "Desc1",
      "Attr1",
      "Loc1",
      "50x50",
      1000,
      5,
      "ST3ROYALTY",
      10
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_AUTHORITY_NOT_VERIFIED);
  });

  it("rejects invalid metaverse id", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.mintDeed(
      "",
      "10,20",
      "Land1",
      "Desc1",
      "Attr1",
      "Loc1",
      "50x50",
      1000,
      5,
      "ST3ROYALTY",
      10
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_METAVERSE_ID);
  });

  it("transfers a deed successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.mintDeed(
      "Meta1",
      "10,20",
      "Land1",
      "Desc1",
      "Attr1",
      "Loc1",
      "50x50",
      1000,
      5,
      "ST3ROYALTY",
      10
    );
    const result = contract.transferDeed(1, "ST4NEW");
    expect(result.ok).toBe(true);
    const owner = contract.getDeedOwner(1);
    expect(owner.value).toBe("ST4NEW");
  });

  it("rejects transfer by non-owner", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.mintDeed(
      "Meta1",
      "10,20",
      "Land1",
      "Desc1",
      "Attr1",
      "Loc1",
      "50x50",
      1000,
      5,
      "ST3ROYALTY",
      10
    );
    contract.caller = "ST5FAKE";
    const result = contract.transferDeed(1, "ST4NEW");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("updates a deed successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.mintDeed(
      "Meta1",
      "10,20",
      "Land1",
      "Desc1",
      "Attr1",
      "Loc1",
      "50x50",
      1000,
      5,
      "ST3ROYALTY",
      10
    );
    const result = contract.updateDeed(1, "NewTitle", "NewDesc", "NewAttr");
    expect(result.ok).toBe(true);
    const update = contract.state.deedUpdates.get(1);
    expect(update?.updateTitle).toBe("NewTitle");
  });

  it("rejects update by non-owner", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.mintDeed(
      "Meta1",
      "10,20",
      "Land1",
      "Desc1",
      "Attr1",
      "Loc1",
      "50x50",
      1000,
      5,
      "ST3ROYALTY",
      10
    );
    contract.caller = "ST5FAKE";
    const result = contract.updateDeed(1, "NewTitle", "NewDesc", "NewAttr");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("burns a deed successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.mintDeed(
      "Meta1",
      "10,20",
      "Land1",
      "Desc1",
      "Attr1",
      "Loc1",
      "50x50",
      1000,
      5,
      "ST3ROYALTY",
      10
    );
    const result = contract.burnDeed(1);
    expect(result.ok).toBe(true);
    const owner = contract.getDeedOwner(1);
    expect(owner.ok).toBe(false);
  });

  it("rejects burn by non-owner", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.mintDeed(
      "Meta1",
      "10,20",
      "Land1",
      "Desc1",
      "Attr1",
      "Loc1",
      "50x50",
      1000,
      5,
      "ST3ROYALTY",
      10
    );
    contract.caller = "ST5FAKE";
    const result = contract.burnDeed(1);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("sets mint fee successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setMintFee(1000);
    expect(result.ok).toBe(true);
    expect(contract.state.mintFee).toBe(1000);
  });

  it("returns correct deed count", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.mintDeed(
      "Meta1",
      "10,20",
      "Land1",
      "Desc1",
      "Attr1",
      "Loc1",
      "50x50",
      1000,
      5,
      "ST3ROYALTY",
      10
    );
    contract.mintDeed(
      "Meta2",
      "30,40",
      "Land2",
      "Desc2",
      "Attr2",
      "Loc2",
      "60x60",
      2000,
      6,
      "ST4ROYALTY",
      15
    );
    const result = contract.getDeedCount();
    expect(result.value).toBe(2);
  });

  it("checks deed existence correctly", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.mintDeed(
      "Meta1",
      "10,20",
      "Land1",
      "Desc1",
      "Attr1",
      "Loc1",
      "50x50",
      1000,
      5,
      "ST3ROYALTY",
      10
    );
    const result = contract.checkDeedExistence("Meta1", "10,20");
    expect(result.value).toBe(true);
    const result2 = contract.checkDeedExistence("Meta3", "50,60");
    expect(result2.value).toBe(false);
  });

  it("parses deed parameters with Clarity types", () => {
    const metaverseId = stringAsciiCV("Meta1");
    const coordinates = stringAsciiCV("10,20");
    const title = stringAsciiCV("Land1");
    const description = stringUtf8CV("Desc1");
    const value = uintCV(1000);
    expect(metaverseId.value).toBe("Meta1");
    expect(coordinates.value).toBe("10,20");
    expect(title.value).toBe("Land1");
    expect(description.value).toBe("Desc1");
    expect(value.value).toEqual(BigInt(1000));
  });

  it("rejects mint with max deeds exceeded", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.state.maxDeeds = 1;
    contract.mintDeed(
      "Meta1",
      "10,20",
      "Land1",
      "Desc1",
      "Attr1",
      "Loc1",
      "50x50",
      1000,
      5,
      "ST3ROYALTY",
      10
    );
    const result = contract.mintDeed(
      "Meta2",
      "30,40",
      "Land2",
      "Desc2",
      "Attr2",
      "Loc2",
      "60x60",
      2000,
      6,
      "ST4ROYALTY",
      15
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_DEEDS_EXCEEDED);
  });
});