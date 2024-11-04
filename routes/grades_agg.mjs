import express from "express";
import db from "../db/conn.mjs";

const router = express.Router();

// Grading Weights by Score Type:
// - Exams: 50%
// - Quizes: 30%
// - Homework: 20%

// Get the weighted average of a specified learner's grades, per class
router.get("/learner/:id/avg-class", async (req, res) => {
    const collection = db.collection("grades");

    const result = await collection.aggregate([
        {
            $match: { learner_id: Number(req.params.id) },
        },
        {
            $unwind: { path: "$scores" },
        },
        {
            $group: {
                _id: "$class_id",
                quiz: {
                    $push: {
                        $cond: {
                            if: { $eq: ["$scores.type", "quiz"] },
                            then: "$scores.score",
                            else: "$$REMOVE",
                        },
                    },
                },
                exam: {
                    $push: {
                        $cond: {
                            if: { $eq: ["$scores.type", "exam"] },
                            then: "$scores.score",
                            else: "$$REMOVE",
                        },
                    },
                },
                homework: {
                    $push: {
                        $cond: {
                            if: { $eq: ["$scores.type", "homework"] },
                            then: "$scores.score",
                            else: "$$REMOVE",
                        },
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                class_id: "$_id",
                avg: {
                    $sum: [
                        {
                            $multiply: [{ $avg: "$exam" }, 0.5]
                        },
                        {
                            $multiply: [{ $avg: "$quiz" }, 0.3]
                        },
                        {
                            $multiply: [{ $avg: "$homework" }, 0.2]
                        },
                    ],
                },
            },
        },
    ]).exec();

    if (!result)
        res.status(404).send("learner_id not found homie!");
    else
        res.status(200).send(result);
});

router.get('/stats', async (req, res) => {
    try {
        const collection = db.collection('grades');
        const result = await collection.aggregate([
            {
                $unwind: '$scores'
            },
            {
                $group: {
                    _id: null,
                    totalLearners: { $sum: 1 },
                    totalScores: { $sum: 1 },
                    totalWeightedScores: {
                        $sum: {
                            $cond: [
                                { $eq: ['$scores.type', 'exam'] },
                                { $multiply: ['$scores.score', 0.5] },
                                { $cond: [
                                    { $eq: ['$scores.type', 'quiz'] },
                                    { $multiply: ['$scores.score', 0.3] },
                                    { $multiply: ['$scores.score', 0.2] }
                                ]}
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalLearners: 1,
                    averageScore: { $divide: ['$totalWeightedScores', '$totalScores'] },
                    learnersAbove50: {
                        $sum: {
                            $cond: [{ $gt: ['$averageScore', 50] }, 1, 0]
                        }
                    },
                    percentageAbove50: {
                        $multiply: [
                            { $divide: ['$learnersAbove50', '$totalLearners'] },
                            100
                        ]
                    }
                }
            }
        ]).exec();

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/stats/:id", async (req, res) => {
    try {
        const collection = db.collection("grades");

        const result = await collection.aggregate([
            { $match: { class_id: Number(req.params.id) } },
            {
                $group: {
                    _id: null,
                    totalLearners: { $sum: 1 },
                    learnersAbove50: {
                        $sum: {
                            $cond: [{ $gt: ["$average", 50] }, 1, 0],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalLearners: 1,
                    learnersAbove50: 1,
                    percentageAbove50: {
                        $multiply: [
                            { $divide: ["$learnersAbove50", "$totalLearners"] },
                            100,
                        ],
                    },
                },
            },
        ]).exec();

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
