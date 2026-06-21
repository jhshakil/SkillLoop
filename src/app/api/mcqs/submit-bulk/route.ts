import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const bulkSubmitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedAnswer: z.number().min(0),
    })
  ).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = bulkSubmitSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const results = await Promise.all(
      validation.data.answers.map(async ({ questionId, selectedAnswer }) => {
        const question = await prisma.mCQQuestion.findUnique({
          where: { id: questionId },
        });
        if (!question) return { questionId, error: "Not found" };

        const isCorrect = selectedAnswer === question.correctAnswer;

        await prisma.mCQSubmission.upsert({
          where: {
            userId_questionId: {
              userId: session.user.id,
              questionId,
            },
          },
          update: { selectedAnswer, isCorrect },
          create: {
            userId: session.user.id,
            questionId,
            selectedAnswer,
            isCorrect,
          },
        });

        return {
          questionId,
          isCorrect,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
        };
      })
    );

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Bulk submit MCQ error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
