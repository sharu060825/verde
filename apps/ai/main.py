import os
import re
from typing import List, Optional, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="AI Expense Tracker Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Data Models -----------------

class CategorizeRequest(BaseModel):
    title: str
    notes: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None

class CategorizeResponse(BaseModel):
    category: str
    confidence: float
    reasoning: str
    suggested_type: str

class TransactionInput(BaseModel):
    id: Optional[str] = None
    title: str
    amount: float
    type: str = "EXPENSE"
    category: str
    date: str

class BudgetInput(BaseModel):
    category: str
    limit: float
    spent: Optional[float] = 0.0

class InsightsRequest(BaseModel):
    transactions: List[TransactionInput] = []
    budgets: List[BudgetInput] = []
    currency: Optional[str] = "INR"

class InsightsResponse(BaseModel):
    summary: str
    key_insights: List[str]
    top_expense_category: str
    spending_anomaly: Optional[str] = None
    savings_rate_comment: str
    health_score: int

class RecommendationItem(BaseModel):
    title: str
    description: str
    potential_savings: float
    priority: str  # HIGH, MEDIUM, LOW
    category: str

class RecommendationsResponse(BaseModel):
    recommendations: List[RecommendationItem]


# ----------------- NLP Rule Database -----------------

CATEGORIZATION_RULES: List[Dict[str, Any]] = [
    # Income
    {
        "category": "Salary",
        "type": "INCOME",
        "keywords": ["salary", "paycheck", "payroll", "stipend", "wages", "direct deposit", "employer"],
        "reasoning": "Identified as primary employment compensation.",
    },
    {
        "category": "Freelance",
        "type": "INCOME",
        "keywords": ["freelance", "upwork", "fiverr", "contract", "consulting", "client payout", "invoice paid", "project fee"],
        "reasoning": "Identified as freelance or contract earnings.",
    },
    {
        "category": "Investments",
        "type": "INCOME",
        "keywords": ["dividend", "stock", "mutual fund", "crypto", "interest", "shares", "trading", "zerodha", "groww", "capital gain"],
        "reasoning": "Identified as investment return or capital gain.",
    },
    {
        "category": "Gifts & Grants",
        "type": "INCOME",
        "keywords": ["gift", "cashback", "reward", "refund", "bonus", "prize"],
        "reasoning": "Identified as gift, grant, or cashback incentive.",
    },
    # Food & Dining
    {
        "category": "Food & Dining",
        "type": "EXPENSE",
        "keywords": [
            "swiggy", "zomato", "restaurant", "mcdonald", "starbucks", "kfc", "burger", "pizza",
            "cafe", "coffee", "dinner", "lunch", "breakfast", "eatery", "bistro", "bakery", "dominos",
            "subway", "taco", "diner", "bar", "pub", "brewery", "chaat", "biryani"
        ],
        "reasoning": "Identified restaurant, cafe, or food delivery transaction.",
    },
    # Groceries
    {
        "category": "Groceries",
        "type": "EXPENSE",
        "keywords": [
            "grocery", "supermarket", "blinkit", "zepto", "instamart", "bigbasket", "milk",
            "vegetables", "fruits", "walmart", "costco", "trader joe", "provision", "spices", "mart"
        ],
        "reasoning": "Identified household groceries and essentials purchase.",
    },
    # Transportation
    {
        "category": "Transportation",
        "type": "EXPENSE",
        "keywords": [
            "uber", "ola", "rapido", "metro", "bus", "train", "flight", "ticket", "petrol", "fuel",
            "diesel", "cab", "taxi", "parking", "toll", "fastag", "irctc", "indigo", "air india",
            "airline", "scooter", "gas station", "commute"
        ],
        "reasoning": "Identified transit, fuel, or ride-hailing expense.",
    },
    # Housing & Rent
    {
        "category": "Housing & Rent",
        "type": "EXPENSE",
        "keywords": ["rent", "landlord", "apartment", "housing", "mortgage", "maintenance", "society fee", "flat maintenance", "lease"],
        "reasoning": "Identified residential rent or housing maintenance payment.",
    },
    # Utilities
    {
        "category": "Utilities",
        "type": "EXPENSE",
        "keywords": [
            "electricity", "water bill", "gas cylinder", "broadband", "wifi", "internet",
            "recharge", "mobile bill", "power bill", "jio", "airtel", "vi recharge", "piped gas"
        ],
        "reasoning": "Identified recurring utility bill or telecommunication fee.",
    },
    # Shopping
    {
        "category": "Shopping",
        "type": "EXPENSE",
        "keywords": [
            "amazon", "flipkart", "myntra", "clothes", "shoes", "electronics", "shopping", "mall",
            "zara", "h&m", "uniqlo", "nykaa", "apparel", "gadget", "headphones", "laptop"
        ],
        "reasoning": "Identified retail goods or e-commerce purchase.",
    },
    # Entertainment
    {
        "category": "Entertainment",
        "type": "EXPENSE",
        "keywords": [
            "netflix", "spotify", "prime", "cinema", "movie", "game", "playstation", "steam",
            "youtube", "theatre", "party", "club", "bookmyshow", "hotstar", "concert", "arcade"
        ],
        "reasoning": "Identified leisure, media subscription, or entertainment expense.",
    },
    # Healthcare
    {
        "category": "Healthcare",
        "type": "EXPENSE",
        "keywords": [
            "doctor", "hospital", "pharmacy", "medicine", "dental", "clinic", "gym", "fitness",
            "health", "yoga", "supplements", "apollo", "1mg", "practo", "cult.fit", "cult fit", "pathology"
        ],
        "reasoning": "Identified medical, wellness, or pharmaceutical expense.",
    },
    # Education
    {
        "category": "Education",
        "type": "EXPENSE",
        "keywords": [
            "tuition", "course", "udemy", "coursera", "books", "school", "college", "exam",
            "class", "tutorial", "stationery", "certification", "degree"
        ],
        "reasoning": "Identified academic, certification, or learning expense.",
    },
    # Travel
    {
        "category": "Travel",
        "type": "EXPENSE",
        "keywords": [
            "hotel", "airbnb", "vacation", "resort", "trip", "booking.com", "makemytrip",
            "expedia", "homestay", "tour", "sightseeing", "visa"
        ],
        "reasoning": "Identified tourism, hospitality, or travel lodging.",
    },
    # Personal Care
    {
        "category": "Personal Care",
        "type": "EXPENSE",
        "keywords": ["salon", "haircut", "spa", "cosmetics", "grooming", "skincare", "barber", "parlour"],
        "reasoning": "Identified grooming or personal wellness purchase.",
    },
]


def classify_text(title: str, notes: Optional[str] = None) -> Dict[str, Any]:
    text = f"{title} {notes or ''}".lower()

    best_match = None
    highest_score = 0

    for rule in CATEGORIZATION_RULES:
        score = 0
        for kw in rule["keywords"]:
            if re.search(r'\b' + re.escape(kw) + r'\b', text):
                score += 3
            elif kw in text:
                score += 1
        
        if score > highest_score:
            highest_score = score
            best_match = rule

    if best_match and highest_score > 0:
        confidence = min(0.98, 0.70 + (highest_score * 0.08))
        return {
            "category": best_match["category"],
            "confidence": round(confidence, 2),
            "reasoning": best_match["reasoning"],
            "suggested_type": best_match["type"],
        }

    return {
        "category": "Other Expense",
        "confidence": 0.45,
        "reasoning": "No specific pattern matched; classified as general expense.",
        "suggested_type": "EXPENSE",
    }


# ----------------- Endpoints -----------------

@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "AI Expense Tracker Service"}


@app.post("/ai/categorize", response_model=CategorizeResponse)
def categorize_transaction(payload: CategorizeRequest) -> CategorizeResponse:
    result = classify_text(payload.title, payload.notes)
    
    # If caller explicitly supplied a type and it contradicts default, respect type if reasonable
    if payload.type and payload.type in ["INCOME", "EXPENSE"]:
        result["suggested_type"] = payload.type

    return CategorizeResponse(**result)


@app.post("/ai/insights", response_model=InsightsResponse)
def generate_insights(payload: InsightsRequest) -> InsightsResponse:
    transactions = payload.transactions
    budgets = payload.budgets
    currency_symbol = "₹" if payload.currency == "INR" else "$"

    total_income = sum(t.amount for t in transactions if t.type == "INCOME")
    total_expense = sum(t.amount for t in transactions if t.type == "EXPENSE")
    net_balance = total_income - total_expense

    savings_rate = round(((total_income - total_expense) / total_income * 100)) if total_income > 0 else 0

    # Group expenses by category
    cat_spend: Dict[str, float] = {}
    for t in transactions:
        if t.type == "EXPENSE":
            cat_spend[t.category] = cat_spend.get(t.category, 0.0) + t.amount

    sorted_cats = sorted(cat_spend.items(), key=lambda x: x[1], reverse=True)
    top_cat = sorted_cats[0][0] if sorted_cats else "None"
    top_cat_amount = sorted_cats[0][1] if sorted_cats else 0.0

    key_insights: List[str] = []

    if total_income > 0:
        key_insights.append(f"Recorded total earnings of {currency_symbol}{total_income:,.2f} with a net savings rate of {savings_rate}%.")

    if top_cat != "None" and total_expense > 0:
        cat_pct = round((top_cat_amount / total_expense) * 100)
        key_insights.append(f"{top_cat} is your largest expense category ({currency_symbol}{top_cat_amount:,.2f}, representing {cat_pct}% of total spending).")

    # Over budget check
    over_budget_cats = []
    for b in budgets:
        cat_spent = cat_spend.get(b.category, b.spent or 0.0)
        if cat_spent > b.limit:
            over_budget_cats.append(f"{b.category} ({currency_symbol}{cat_spent:,.2f} / {currency_symbol}{b.limit:,.2f})")

    spending_anomaly = None
    if over_budget_cats:
        spending_anomaly = f"Over-budget in: {', '.join(over_budget_cats)}"
        key_insights.append(f"Spending alert: Exceeded limits in {len(over_budget_cats)} budget categories.")
    elif budgets:
        key_insights.append("All category budgets are currently within safe allocations.")

    if not key_insights:
        key_insights.append("Start logging your daily transactions and monthly budgets to generate automated AI financial intelligence.")

    # Savings rate comment
    if savings_rate >= 30:
        savings_comment = "Outstanding financial discipline! You are saving over 30% of your total income."
    elif savings_rate >= 20:
        savings_comment = "Healthy financial footing. You meet the recommended 20% savings rule."
    elif savings_rate > 0:
        savings_comment = "Positive cash flow, but opportunities exist to cut non-essential expenses and boost savings."
    else:
        savings_comment = "Spending currently exceeds or matches income. Review high-spend categories to rebalance cash flow."

    # Health score
    score = 50
    if total_income > total_expense:
        score += min(35, savings_rate)
    if budgets and not over_budget_cats:
        score += 15
    elif over_budget_cats:
        score -= min(25, len(over_budget_cats) * 10)

    health_score = max(10, min(100, int(score)))

    summary_text = (
        f"Analyzed {len(transactions)} transactions totaling {currency_symbol}{total_expense:,.2f} in expenses "
        f"and {currency_symbol}{total_income:,.2f} in income."
        if transactions else "No transaction data available yet. Add entries to see comprehensive analytics."
    )

    return InsightsResponse(
        summary=summary_text,
        key_insights=key_insights,
        top_expense_category=top_cat,
        spending_anomaly=spending_anomaly,
        savings_rate_comment=savings_comment,
        health_score=health_score,
    )


@app.post("/ai/recommendations", response_model=RecommendationsResponse)
def generate_recommendations(payload: InsightsRequest) -> RecommendationsResponse:
    transactions = payload.transactions
    budgets = payload.budgets
    currency_symbol = "₹" if payload.currency == "INR" else "$"

    cat_spend: Dict[str, float] = {}
    for t in transactions:
        if t.type == "EXPENSE":
            cat_spend[t.category] = cat_spend.get(t.category, 0.0) + t.amount

    total_expense = sum(cat_spend.values())
    recommendations: List[RecommendationItem] = []

    # 1. Check over-budget categories
    for b in budgets:
        spent = cat_spend.get(b.category, b.spent or 0.0)
        if spent > b.limit:
            overage = spent - b.limit
            recommendations.append(
                RecommendationItem(
                    title=f"Cut {b.category} Spending",
                    description=f"You exceeded your monthly budget for {b.category} by {currency_symbol}{overage:,.2f}. Pause discretionary purchases in this category.",
                    potential_savings=round(overage, 2),
                    priority="HIGH",
                    category=b.category,
                )
            )

    # 2. Check high single-category concentration
    for cat, amount in cat_spend.items():
        if total_expense > 0 and (amount / total_expense) > 0.35 and cat not in ["Housing & Rent", "Education"]:
            potential = round(amount * 0.15, 2)
            recommendations.append(
                RecommendationItem(
                    title=f"Optimize {cat} Outlays",
                    description=f"{cat} takes up {round((amount / total_expense) * 100)}% of your monthly expense. Reducing this by 15% would save {currency_symbol}{potential:,.2f}.",
                    potential_savings=potential,
                    priority="MEDIUM",
                    category=cat,
                )
            )

    # 3. Frequency of dining/food deliveries
    food_spend = cat_spend.get("Food & Dining", 0.0)
    if food_spend > 2500:
        potential = round(food_spend * 0.20, 2)
        recommendations.append(
            RecommendationItem(
                title="Prepare More Home Meals",
                description=f"Dining and delivery spending totaled {currency_symbol}{food_spend:,.2f}. Cooking 2-3 extra meals a week can save up to {currency_symbol}{potential:,.2f}.",
                potential_savings=potential,
                priority="MEDIUM",
                category="Food & Dining",
            )
        )

    # 4. Fallback generic recommendation
    if not recommendations:
        recommendations.append(
            RecommendationItem(
                title="Build an Emergency Fund Target",
                description="Set aside 15-20% of incoming income into high-yield savings to create a 3-6 month safety buffer.",
                potential_savings=round(total_expense * 0.1, 2) if total_expense > 0 else 5000.0,
                priority="LOW",
                category="Savings",
            )
        )

    return RecommendationsResponse(recommendations=recommendations)


# ----------------- Financial Companion Chat -----------------

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class CompanionChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    context: Dict[str, Any]
    current_page: Optional[str] = "/dashboard"

class CompanionChatResponse(BaseModel):
    reply: str
    proactive_insights: List[Dict[str, Any]] = []
    suggested_followups: List[str] = []


def evaluate_financial_query(query: str, context: Dict[str, Any], current_page: str) -> Dict[str, Any]:
    q = query.lower()
    user_info = context.get("user", {})
    name = user_info.get("name", "there")
    currency = "₹" if user_info.get("currency") == "INR" else "$"
    
    summary = context.get("summary", {})
    categories = context.get("categories", [])
    budgets = context.get("budgets", [])
    budget_health = context.get("budgetHealth", {})
    recent_tx = context.get("recentTransactions", [])
    proactive = context.get("proactiveInsights", [])

    spent = summary.get("currentMonthExpense", 0)
    income = summary.get("currentMonthIncome", 0)
    balance = summary.get("currentMonthBalance", 0)
    savings_rate = summary.get("savingsRate", 0)
    top_cat = summary.get("topCategory", "None")
    top_amt = summary.get("topCategoryAmount", 0)
    safe_weekly = budget_health.get("safeWeeklySpend", 0)
    remaining_budget = budget_health.get("totalBudgetRemaining", 0)

    # 1. Affordability: "Can I afford ₹X?"
    afford_match = re.search(r'(?:afford|spend|buy|purchase).*?(\d[\d,]*)', q) or re.search(r'(\d[\d,]*).*?(?:afford|spend)', q)
    if afford_match and ("afford" in q or "can i spend" in q):
        raw_val = afford_match.group(1).replace(",", "")
        try:
            target = float(raw_val)
            if target > 0:
                if summary.get("totalTransactionsCount", 0) == 0:
                    return {
                        "reply": f"I don't have enough spending history yet to make a reliable comparison, {name}. But if {currency}{target:,.2f} fits safely within your net earnings after essentials, you can consider it!",
                        "suggested_followups": ["Where is my money going?", "How do I set a budget?"],
                        "proactive_insights": proactive,
                    }
                
                if target <= safe_weekly and safe_weekly > 0:
                    return {
                        "reply": f"Yes, you can afford {currency}{target:,.2f}! 👍\n\nYour safe weekly spending pace is about **{currency}{safe_weekly:,.2f}** (with {currency}{remaining_budget:,.2f} left across your planned monthly budgets). Just keep an eye on other discretionary spending for the rest of the week.",
                        "suggested_followups": ["How much is left in my budgets?", "Am I overspending?"],
                        "proactive_insights": proactive,
                    }
                elif target <= balance and balance > 0:
                    return {
                        "reply": f"You have the cash cushion for {currency}{target:,.2f} (current monthly net balance is **{currency}{balance:,.2f}**), but it exceeds your ideal weekly budget pace of {currency}{safe_weekly:,.2f}.\n\nIf you purchase this, try pacing other discretionary expenses for the next 7 days.",
                        "suggested_followups": ["What should I cut back on?", "Help me save money"],
                        "proactive_insights": proactive,
                    }
                else:
                    return {
                        "reply": f"Spending {currency}{target:,.2f} right now might pinch your cash flow. ⚠️\n\nYour remaining safe budget for the month is **{currency}{remaining_budget:,.2f}**, and you've already spent {currency}{spent:,.2f}. If this isn't urgent, holding off or splitting the cost would be the wiser move.",
                        "suggested_followups": ["Where is my money going?", "What should I cut back on?"],
                        "proactive_insights": proactive,
                    }
        except ValueError:
            pass

    # 2. Where is my money going?
    if any(k in q for k in ["where is my money going", "breakdown", "category", "where am i spending", "spending on"]):
        if not categories:
            return {
                "reply": f"Hey {name}! You haven't recorded any expenses yet this month. Once you log transactions, I'll chart out exactly where every coin goes.",
                "suggested_followups": ["How do I set up a budget?", "Help me save money"],
                "proactive_insights": proactive,
            }
        
        cat_lines = [f"• **{c['category']}**: {currency}{c['spent']:,.2f} ({c['percentage']}% of total)" for c in categories[:3]]
        return {
            "reply": f"Here is where your money is heading this month, {name}:\n\n" + "\n".join(cat_lines) + f"\n\nYour biggest concentration is in **{top_cat}**. Would you like tips to optimize it?",
            "suggested_followups": [f"Help me reduce {top_cat} spending", "Am I overspending?", "How much can I spend this week?"],
            "proactive_insights": proactive,
        }

    # 3. How much did I spend?
    if "how much" in q and any(k in q for k in ["spend", "spent", "expense"]):
        return {
            "reply": f"You've spent **{currency}{spent:,.2f}** so far this month across {summary.get('totalTransactionsCount', 0)} entries. Your recorded income is **{currency}{income:,.2f}**, giving you an active savings rate of **{savings_rate}%**.",
            "suggested_followups": ["Where is my money going?", "Am I overspending?", "Show me my biggest expenses"],
            "proactive_insights": proactive,
        }

    # 4. Overspending / Budget status
    if any(k in q for k in ["overspending", "over budget", "budget", "limit"]):
        over_cats = budget_health.get("overBudgetCategories", [])
        near_cats = budget_health.get("nearLimitCategories", [])

        if over_cats:
            return {
                "reply": f"⚠️ Heads up: You have exceeded the limit in **{', '.join(over_cats)}** this month.\n\nYour overall remaining safe budget across other categories is **{currency}{remaining_budget:,.2f}**. Want me to help you balance your other allocations?",
                "suggested_followups": [f"Help me cut back on {over_cats[0]}", "How much can I spend this week?"],
                "proactive_insights": proactive,
            }
        elif near_cats:
            return {
                "reply": f"You're mostly on track, but **{', '.join(near_cats)}** is getting close (over 80% used). Pacing your purchases there will keep your budget safe!",
                "suggested_followups": ["How much can I spend this week?", "Show me my biggest expenses"],
                "proactive_insights": proactive,
            }
        elif not budgets:
            return {
                "reply": f"You haven't set category budgets yet, so I don't have hard targets to compare against. Your net cash flow is **{currency}{balance:,.2f}**. Would you like some suggestions for initial category budgets?",
                "suggested_followups": ["What categories should I budget for?", "Where is my money going?"],
                "proactive_insights": proactive,
            }
        else:
            return {
                "reply": f"Looking good! 🎉 All {len(budgets)} of your configured category budgets are within safe thresholds, and you have **{currency}{remaining_budget:,.2f}** remaining this month.",
                "suggested_followups": ["How much can I spend this week?", "Help me save money"],
                "proactive_insights": proactive,
            }

    # 5. Largest expenses
    if any(k in q for k in ["biggest", "largest", "highest", "major"]):
        if not recent_tx:
            return {
                "reply": "No expense entries recorded yet! Log your transactions and I'll keep track of your biggest outlays.",
                "suggested_followups": ["Where is my money going?"],
                "proactive_insights": proactive,
            }
        
        sorted_exp = sorted([t for t in recent_tx if t.get("type") == "EXPENSE"], key=lambda x: x.get("amount", 0), reverse=True)[:3]
        lines = [f"• **{t.get('title', 'Expense')}** ({t.get('category', 'Other')}): {currency}{t.get('amount', 0):,.2f} on {t.get('date', '')}" for t in sorted_exp]
        return {
            "reply": f"Here are your largest recent expenses:\n\n" + "\n".join(lines) + "\n\nNotice any recurring patterns you'd like to optimize?",
            "suggested_followups": ["Help me save money", "Am I overspending?"],
            "proactive_insights": proactive,
        }

    # 6. Help me save / Recommendations
    if any(k in q for k in ["save", "cut back", "reduce", "tips", "advice"]):
        return {
            "reply": f"Here are three practical ideas tailored to your spending pattern, {name}:\n\n"
                    f"1. **Audit {top_cat}**: It currently makes up {summary.get('topCategoryPercent', 0)}% of your spend ({currency}{top_amt:,.2f}). Trimming just 10% frees up {currency}{round(top_amt * 0.1):,.2f}.\n"
                    f"2. **Follow the 50/30/20 guideline**: Aim to cap essential needs at 50%, discretionary wants at 30%, and channel 20% directly into savings buffer.\n"
                    f"3. **Micro-Budgeting**: Instead of checking once a month, keep an eye on your safe weekly pace of **{currency}{safe_weekly:,.2f}**.",
            "suggested_followups": ["How much can I spend this week?", "Where is my money going?", "Am I overspending?"],
            "proactive_insights": proactive,
        }

    # 7. Default friendly response
    page_note = ""
    if current_page == "/analytics":
        page_note = " I see you're checking Analytics—want me to break down your highest spending spike?"
    elif current_page == "/budgets":
        page_note = " I see you're on the Budgets page—want me to check which category has the least remaining buffer?"
    elif current_page == "/expenses":
        page_note = " I see you're browsing your transaction ledger—want me to find your top recurring purchases?"

    return {
        "reply": f"Hey {name}! 🕷 I'm keeping an eye on your finances. Right now, your net monthly balance is **{currency}{balance:,.2f}** with a **{savings_rate}%** savings rate.{page_note}\n\nWhat would you like to look into?",
        "suggested_followups": [
            "Where is my money going?",
            "Am I overspending?",
            "How much can I spend this week?",
            "Show me my biggest expenses",
        ],
        "proactive_insights": proactive,
    }


@app.post("/ai/chat", response_model=CompanionChatResponse)
def companion_chat(payload: CompanionChatRequest) -> CompanionChatResponse:
    gemini_key = os.getenv("GEMINI_API_KEY")

    # If Gemini API key is configured, we can query Gemini with the structured context
    if gemini_key:
        try:
            import json
            import urllib.request

            system_instruction = (
                "You are Dex, a friendly, intelligent, slightly playful, and supportive personal financial companion "
                "with a subtle spider persona living inside an expense tracker app. "
                "You speak in a warm, concise, and non-judgmental tone (never like a dry bank textbook or robot). "
                "CRITICAL: Never fabricate or hallucinate financial numbers. ONLY reference the numbers provided in the "
                "user's financial context. Distinguish known data from general budgeting principles (e.g. 50/30/20 rule). "
                "Keep responses under 3-4 concise paragraphs."
            )

            prompt = (
                f"{system_instruction}\n\n"
                f"CURRENT FINANCIAL CONTEXT:\n{json.dumps(payload.context, indent=2)}\n\n"
                f"CURRENT PAGE: {payload.current_page}\n\n"
                f"USER QUERY: {payload.message}"
            )

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            req_data = json.dumps({
                "contents": [{"parts": [{"text": prompt}]}]
            }).encode("utf-8")

            req = urllib.request.Request(url, data=req_data, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                text_reply = data["candidates"][0]["content"]["parts"][0]["text"]
                return CompanionChatResponse(
                    reply=text_reply,
                    proactive_insights=payload.context.get("proactiveInsights", []),
                    suggested_followups=[
                        "Where is my money going?",
                        "Am I overspending?",
                        "How much can I spend this week?",
                    ]
                )
        except Exception:
            # Fall back to high-fidelity grounded rule engine on any error
            pass

    # Built-in grounded financial reasoning engine
    result = evaluate_financial_query(payload.message, payload.context, payload.current_page or "/dashboard")
    return CompanionChatResponse(**result)

