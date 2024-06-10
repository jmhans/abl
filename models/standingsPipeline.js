let StandingsPipeline = [
  {
    $match: {
      gameType: "R"
    }
  },
  {
    $project: {
      active: 0,
      homeTeamRoster: 0,
      awayTeamRoster: 0,
      "results.scores.players": 0
    }
  },
  {
    $unwind: {
      path: "$results",
      preserveNullAndEmptyArrays: false
    }
  },
  {
    $addFields: {
      "results.loser": {
        $cond: [
          {
            $eq: [
              {
                $type: "$results.loser"
              },
              "string"
            ]
          },
          {
            $toString: "$results.loser"
          },
          {
            $cond: [
              {
                $eq: [
                  {
                    $type: "$results.loser"
                  },
                  "objectId"
                ]
              },
              {
                $toString: "$results.loser"
              },
              {
                $toString: "$results.loser._id"
              }
            ]
          }
        ]
      },
      "results.winner": {
        $cond: [
          {
            $eq: [
              {
                $type: "$results.winner"
              },
              "string"
            ]
          },
          {
            $toString: "$results.winner"
          },
          {
            $cond: [
              {
                $eq: [
                  {
                    $type: "$results.winner"
                  },
                  "objectId"
                ]
              },
              {
                $toString: "$results.winner"
              },
              {
                $toString: "$results.winner._id"
              }
            ]
          }
        ]
      }
    }
  },
  {
    $addFields: {
      teams: ["$awayTeam", "$homeTeam"]
    }
  },
  {
    $unwind: {
      path: "$teams",
      preserveNullAndEmptyArrays: false
    }
  },
  {
    $unwind: {
      preserveNullAndEmptyArrays: true,
      path: "$results.scores"
    }
  },
  {
    $addFields: {
      "results.scores.unadjusted_runs": {
        $subtract: [
          {
            $divide: [
              "$results.scores.final.abl_points",
              "$results.scores.final.ab"
            ]
          },
          4.5
        ]
      },
      "results.scores.gameId": "$_id",
      "results.scores.outcome": {
        $cond: [
          {
            $eq: [
              "$results.winner",
              {
                $toString: "$results.scores.team"
              }
            ]
          },
          "w",
          "l"
        ]
      },
      "results.extras": {
        $ne: [
          "$results.scores.regulation.ab",
          "$results.scores.final.ab"
        ]
      }
    }
  },
  {
    $group: {
      l: {
        $sum: {
          $cond: [
            {
              $and: [
                {
                  $eq: [
                    {
                      $toObjectId:
                        "$results.scores.team"
                    },
                    "$teams"
                  ]
                },
                {
                  $eq: [
                    "$results.scores.outcome",
                    "l"
                  ]
                }
              ]
            },
            1,
            0
          ]
        }
      },
      _id: "$teams",
      outcomes: {
        $push: {
          $cond: [
            {
              $eq: [
                {
                  $toObjectId:
                    "$results.scores.team"
                },
                "$teams"
              ]
            },
            {
              extras: "$results.extras",
              outcome: "$results.scores.outcome",
              gameDate: "$gameDate",
              location:
                "$results.scores.location",
              final: "$results.scores.final"
            },
            "$$REMOVE"
          ]
        }
      },
      scores_against: {
        $push: {
          $cond: [
            {
              $ne: [
                {
                  $toObjectId:
                    "$results.scores.team"
                },
                "$teams"
              ]
            },
            {
              extras: "$results.extras",
              outcome: "$results.scores.outcome",
              gameDate: "$gameDate",
              location:
                "$results.scores.location",
              final: "$results.scores.final"
            },
            "$$REMOVE"
          ]
        }
      },
      w: {
        $sum: {
          $cond: [
            {
              $and: [
                {
                  $eq: [
                    {
                      $toObjectId:
                        "$results.scores.team"
                    },
                    "$teams"
                  ]
                },
                {
                  $eq: [
                    "$results.scores.outcome",
                    "w"
                  ]
                }
              ]
            },
            1,
            0
          ]
        }
      }
    }
  },
  {
    $addFields: {
      bb: {
        $sum: "$outcomes.final.bb"
      },
      era: {
        $avg: "$scores_against.final.abl_runs"
      },
      hr_allowed: {
        $sum: "$scores_against.final.hr"
      },
      sf: {
        $sum: "$outcomes.final.sf"
      },
      cs: {
        $sum: "$outcomes.final.cs"
      },
      win_pct: {
        $divide: [
          "$w",
          {
            $add: ["$w", "$l"]
          }
        ]
      },
      avg_runs: {
        $subtract: [
          {
            $divide: [
              {
                $sum: "$outcomes.final.abl_points"
              },
              {
                $sum: "$outcomes.final.ab"
              }
            ]
          },
          4.5
        ]
      },
      ab: {
        $sum: "$outcomes.final.ab"
      },
      h: {
        $sum: "$outcomes.final.h"
      },
      extras: {
        wins: {
          $size: {
            $filter: {
              as: "outcome",
              input: "$outcomes",
              cond: {
                $and: [
                  {
                    $eq: [
                      "$$outcome.outcome",
                      "w"
                    ]
                  },
                  {
                    $eq: [
                      "$$outcome.extras",
                      true
                    ]
                  }
                ]
              }
            }
          }
        },
        losses: {
          $size: {
            $filter: {
              cond: {
                $and: [
                  {
                    $eq: [
                      "$$outcome.outcome",
                      "l"
                    ]
                  },
                  {
                    $eq: [
                      "$$outcome.extras",
                      true
                    ]
                  }
                ]
              },
              as: "outcome",
              input: "$outcomes"
            }
          }
        }
      },
      "2b": {
        $sum: "$outcomes.final.2b"
      },
      g: {
        $add: ["$w", "$l"]
      },
      home: {
        losses: {
          $size: {
            $filter: {
              input: "$outcomes",
              cond: {
                $and: [
                  {
                    $eq: [
                      "$$outcome.outcome",
                      "l"
                    ]
                  },
                  {
                    $eq: [
                      "$$outcome.location",
                      "H"
                    ]
                  }
                ]
              },
              as: "outcome"
            }
          }
        },
        wins: {
          $size: {
            $filter: {
              cond: {
                $and: [
                  {
                    $eq: [
                      "$$outcome.outcome",
                      "w"
                    ]
                  },
                  {
                    $eq: [
                      "$$outcome.location",
                      "H"
                    ]
                  }
                ]
              },
              as: "outcome",
              input: "$outcomes"
            }
          }
        }
      },
      "3b": {
        $sum: "$outcomes.final.3b"
      },
      sb: {
        $sum: "$outcomes.final.sb"
      },
      sac: {
        $sum: "$outcomes.final.sac"
      },
      hbp: {
        $sum: "$outcomes.final.hbp"
      },
      hr: {
        $sum: "$outcomes.final.hr"
      },
      e: {
        $sum: "$outcomes.final.e"
      },
      away: {
        wins: {
          $size: {
            $filter: {
              input: "$outcomes",
              cond: {
                $and: [
                  {
                    $eq: [
                      "$$outcome.outcome",
                      "w"
                    ]
                  },
                  {
                    $eq: [
                      "$$outcome.location",
                      "A"
                    ]
                  }
                ]
              },
              as: "outcome"
            }
          }
        },
        losses: {
          $size: {
            $filter: {
              input: "$outcomes",
              cond: {
                $and: [
                  {
                    $eq: [
                      "$$outcome.outcome",
                      "l"
                    ]
                  },
                  {
                    $eq: [
                      "$$outcome.location",
                      "A"
                    ]
                  }
                ]
              },
              as: "outcome"
            }
          }
        }
      },
      abl_runs: {
        $avg: "$outcomes.final.abl_runs"
      }
    }
  },
  {
    $lookup: {
      foreignField: "_id",
      as: "tm",
      from: "ablteams",
      localField: "_id"
    }
  },
  {
    $project: {
      scores: 0,
      scores_against: 0
    }
  },
  {
    $unwind: {
      path: "$tm",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $sort: {
      abl_runs: -1,
      win_pct: -1
    }
  },
  {
    $lookup: {
      as: "AdvancedStandings",
      from: "advanced_standings_view",
      localField: "tm.nickname",
      foreignField: "_id"
    }
  },
  {
    $unwind: {
      preserveNullAndEmptyArrays: false,
      path: "$AdvancedStandings"
    }
  }
]


module.exports = StandingsPipeline;
