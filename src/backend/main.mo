import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Nat "mo:core/Nat";

actor {
  type ScoreEntry = {
    userId : Principal;
    score : Nat;
  };

  module ScoreEntry {
    public func compareByScore(a : ScoreEntry, b : ScoreEntry) : Order.Order {
      Nat.compare(b.score, a.score);
    };
  };

  let highScores = Map.empty<Principal, Nat>();

  public shared ({ caller }) func saveScore(score : Nat) : async () {
    switch (highScores.get(caller)) {
      case (null) { highScores.add(caller, score) };
      case (?existingScore) {
        if (score > existingScore) {
          highScores.add(caller, score);
        };
      };
    };
  };

  public query ({ caller }) func getHighScore() : async Nat {
    switch (highScores.get(caller)) {
      case (null) { Runtime.trap("No high score found for this user") };
      case (?score) { score };
    };
  };

  public query func getLeaderboard() : async [ScoreEntry] {
    let allEntries = highScores.toArray().map(
      func((userId, score)) {
        {
          userId;
          score;
        };
      }
    ).sort(ScoreEntry.compareByScore);

    allEntries.sliceToArray(0, Nat.min(10, allEntries.size()));
  };
};
