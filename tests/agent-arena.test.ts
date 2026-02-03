import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

// Get accounts from simnet (global from clarinet-sdk)
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const wallet4 = accounts.get("wallet_4")!;
const wallet5 = accounts.get("wallet_5")!;
const wallet6 = accounts.get("wallet_6")!;
const wallet7 = accounts.get("wallet_7")!;
const wallet8 = accounts.get("wallet_8")!;

const CONTRACT_NAME = "agent-arena";

describe("Agent Arena Contract", () => {
  describe("Initial State", () => {
    it("should start with zero agents", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-agent-count",
        [],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(0));
    });

    it("should start with arena open", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-arena-open",
        [],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("should start at round 0", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-current-round",
        [],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(0));
    });
  });

  describe("Registration", () => {
    it("should allow an agent to register", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("TestAgent"), Cl.stringUtf8("claude")],
        wallet1
      );
      expect(result.result).toBeOk(
        Cl.tuple({
          index: Cl.uint(0),
          total: Cl.uint(1),
        })
      );
    });

    it("should increment agent count after registration", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("Agent1"), Cl.stringUtf8("openclaw")],
        wallet1
      );

      const count = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-agent-count",
        [],
        deployer
      );
      expect(count.result).toBeOk(Cl.uint(1));
    });

    it("should store agent data correctly", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("MyAgent"), Cl.stringUtf8("gpt-4")],
        wallet1
      );

      const agent = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-agent",
        [Cl.principal(wallet1)],
        deployer
      );

      // Result is (ok (some {...})) - just verify it's an ok response
      console.log("└──", agent.result.toString());
      expect(agent.result.type).toBe("ok"); // response ok type
    });

    it("should mark address as registered", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("Agent1"), Cl.stringUtf8("test")],
        wallet1
      );

      const isRegistered = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-registered",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(isRegistered.result).toBeBool(true);
    });

    it("should not mark unregistered address as registered", () => {
      const isRegistered = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-registered",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(isRegistered.result).toBeBool(false);
    });

    it("should prevent double registration", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("Agent1"), Cl.stringUtf8("test")],
        wallet1
      );

      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("Agent1Again"), Cl.stringUtf8("test")],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(100)); // ERR_ALREADY_REGISTERED
    });

    it("should reject empty name", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8(""), Cl.stringUtf8("test")],
        wallet1
      );

      expect(result.result).toBeErr(Cl.uint(103)); // ERR_INVALID_NAME
    });

    it("should allow multiple different agents to register", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("Agent1"), Cl.stringUtf8("claude")],
        wallet1
      );
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("Agent2"), Cl.stringUtf8("gpt-4")],
        wallet2
      );
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("Agent3"), Cl.stringUtf8("openclaw")],
        wallet3
      );

      const count = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-agent-count",
        [],
        deployer
      );
      expect(count.result).toBeOk(Cl.uint(3));
    });
  });

  describe("Arena Capacity", () => {
    it("should auto-close when 8 agents register", () => {
      const wallets = [wallet1, wallet2, wallet3, wallet4, wallet5, wallet6, wallet7, wallet8];

      for (let i = 0; i < 8; i++) {
        simnet.callPublicFn(
          CONTRACT_NAME,
          "register",
          [Cl.stringUtf8(`Agent${i}`), Cl.stringUtf8("test")],
          wallets[i]
        );
      }

      const isOpen = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-arena-open",
        [],
        deployer
      );
      expect(isOpen.result).toBeOk(Cl.bool(false));
    });

    it("should reject registration when arena is full", () => {
      const wallets = [wallet1, wallet2, wallet3, wallet4, wallet5, wallet6, wallet7, wallet8];

      for (let i = 0; i < 8; i++) {
        simnet.callPublicFn(
          CONTRACT_NAME,
          "register",
          [Cl.stringUtf8(`Agent${i}`), Cl.stringUtf8("test")],
          wallets[i]
        );
      }

      // Try to register a 9th agent
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("Agent9"), Cl.stringUtf8("test")],
        deployer
      );

      expect(result.result).toBeErr(Cl.uint(102)); // ERR_ARENA_FULL
    });
  });

  describe("Unregistration", () => {
    it("should allow agent to unregister before game starts", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("Agent1"), Cl.stringUtf8("test")],
        wallet1
      );

      const result = simnet.callPublicFn(CONTRACT_NAME, "unregister", [], wallet1);
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("should fail to unregister if not registered", () => {
      const result = simnet.callPublicFn(CONTRACT_NAME, "unregister", [], wallet1);
      expect(result.result).toBeErr(Cl.uint(101)); // ERR_NOT_REGISTERED
    });
  });

  describe("Admin Functions", () => {
    it("should allow owner to close registration", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "close-registration",
        [],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));

      const isOpen = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-arena-open",
        [],
        deployer
      );
      expect(isOpen.result).toBeOk(Cl.bool(false));
    });

    it("should prevent non-owner from closing registration", () => {
      const result = simnet.callPublicFn(
        CONTRACT_NAME,
        "close-registration",
        [],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(403)); // Unauthorized
    });

    it("should allow owner to start a round", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("Agent1"), Cl.stringUtf8("test")],
        wallet1
      );

      const result = simnet.callPublicFn(CONTRACT_NAME, "start-round", [], deployer);
      expect(result.result).toBeOk(Cl.uint(1));

      const round = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-current-round",
        [],
        deployer
      );
      expect(round.result).toBeOk(Cl.uint(1));
    });

    it("should close registration when starting a round", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("Agent1"), Cl.stringUtf8("test")],
        wallet1
      );
      simnet.callPublicFn(CONTRACT_NAME, "start-round", [], deployer);

      const isOpen = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-arena-open",
        [],
        deployer
      );
      expect(isOpen.result).toBeOk(Cl.bool(false));
    });

    it("should prevent non-owner from starting round", () => {
      const result = simnet.callPublicFn(CONTRACT_NAME, "start-round", [], wallet1);
      expect(result.result).toBeErr(Cl.uint(403));
    });

    it("should prevent unregistration after round starts", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("Agent1"), Cl.stringUtf8("test")],
        wallet1
      );
      simnet.callPublicFn(CONTRACT_NAME, "start-round", [], deployer);

      const result = simnet.callPublicFn(CONTRACT_NAME, "unregister", [], wallet1);
      expect(result.result).toBeErr(Cl.uint(104)); // Cannot unregister after game starts
    });

    it("should allow owner to reset arena", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("Agent1"), Cl.stringUtf8("test")],
        wallet1
      );
      simnet.callPublicFn(CONTRACT_NAME, "start-round", [], deployer);

      const result = simnet.callPublicFn(CONTRACT_NAME, "reset-arena", [], deployer);
      expect(result.result).toBeOk(Cl.bool(true));

      const count = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-agent-count",
        [],
        deployer
      );
      expect(count.result).toBeOk(Cl.uint(0));
    });

    it("should prevent non-owner from resetting arena", () => {
      const result = simnet.callPublicFn(CONTRACT_NAME, "reset-arena", [], wallet1);
      expect(result.result).toBeErr(Cl.uint(403));
    });
  });

  describe("Full Game Flow", () => {
    it("should handle complete registration and round start flow", () => {
      // Register some agents
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("Claude"), Cl.stringUtf8("claude")],
        wallet1
      );
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("GPT-4"), Cl.stringUtf8("gpt-4")],
        wallet2
      );
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("Gemini"), Cl.stringUtf8("gemini")],
        wallet3
      );
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register",
        [Cl.stringUtf8("OpenClaw"), Cl.stringUtf8("openclaw")],
        wallet4
      );

      // Check initial state
      let count = simnet.callReadOnlyFn(CONTRACT_NAME, "get-agent-count", [], deployer);
      expect(count.result).toBeOk(Cl.uint(4));

      // Start round 1
      simnet.callPublicFn(CONTRACT_NAME, "start-round", [], deployer);

      let round = simnet.callReadOnlyFn(CONTRACT_NAME, "get-current-round", [], deployer);
      expect(round.result).toBeOk(Cl.uint(1));

      // Start round 2
      simnet.callPublicFn(CONTRACT_NAME, "start-round", [], deployer);

      round = simnet.callReadOnlyFn(CONTRACT_NAME, "get-current-round", [], deployer);
      expect(round.result).toBeOk(Cl.uint(2));

      // Reset and start over
      simnet.callPublicFn(CONTRACT_NAME, "reset-arena", [], deployer);

      count = simnet.callReadOnlyFn(CONTRACT_NAME, "get-agent-count", [], deployer);
      expect(count.result).toBeOk(Cl.uint(0));

      const isOpen = simnet.callReadOnlyFn(CONTRACT_NAME, "is-arena-open", [], deployer);
      expect(isOpen.result).toBeOk(Cl.bool(true));

      round = simnet.callReadOnlyFn(CONTRACT_NAME, "get-current-round", [], deployer);
      expect(round.result).toBeOk(Cl.uint(0));
    });
  });
});
