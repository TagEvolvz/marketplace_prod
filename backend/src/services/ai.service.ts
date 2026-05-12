/**
 * ai.service.ts
 *
 * All AI features are centralized here:
 *   - Shopping assistant (chat)
 *   - Smart product search
 *   - Product description generator (admin)
 *   - Inventory insights (admin)
 */

import { Product } from '../models/Product';
import { Category } from '../models/index';
import { chatCompletion } from '../config/ai';
import logger from '../utils/logger';

export class AIService {
  // ─── Shopping Assistant ───────────────────────────────────────────────────
  /**
   * Answers customer questions and guides them to products.
   * Receives the full conversation history to maintain context.
   */
  async chat(
    messages: { role: 'user' | 'assistant'; content: string }[],
    sessionContext?: { cartItems?: string[]; currentPage?: string }
  ): Promise<string> {
    // Fetch live product count and categories for context
    const [productCount, categories] = await Promise.all([
      Product.countDocuments({ status: 'active' }),
      Category.find({ parent: null, isActive: true }).select('name storeSection').lean(),
    ]);

    const storeSections = categories.map((c) => `${c.name} (${c.storeSection})`).join(', ');

    const systemPrompt = `You are a helpful shopping assistant for a store that sells products in three sections: ${storeSections}. We currently have ${productCount} active products.

Your job:
- Help customers find products they need
- Suggest relevant items based on their needs
- Answer questions about availability, pricing, and categories
- Guide them through the checkout process if needed
- If they ask about specific products you don't have data on, suggest checking the relevant section

Keep responses concise (2-4 sentences max). Be friendly and helpful. Do not make up prices or product names. If you don't know, say so and direct them to browse the relevant category.

${sessionContext?.cartItems?.length ? `Customer's cart: ${sessionContext.cartItems.join(', ')}` : ''}
${sessionContext?.currentPage ? `Current page: ${sessionContext.currentPage}` : ''}`;

    try {
      return await chatCompletion([
        { role: 'system', content: systemPrompt },
        ...messages,
      ], { max_tokens: 300 });
    } catch (err) {
      logger.error('AI chat error', { error: (err as Error).message });
      throw new Error('AI assistant is temporarily unavailable. Please browse our categories directly.');
    }
  }

  // ─── Smart Search ──────────────────────────────────────────────────────────
  /**
   * Converts a natural-language query into structured search filters,
   * then queries the database.
   */
  async smartSearch(query: string): Promise<{
    products: unknown[];
    interpretation: string;
    filters: Record<string, unknown>;
  }> {
    const categories = await Category.find({ isActive: true }).select('name slug storeSection parent').lean();
    const categoryNames = categories.map((c) => c.name).join(', ');

    const interpretPrompt = `You are a product search engine. A user searched for: "${query}"

Available categories: ${categoryNames}

Respond ONLY with a JSON object (no explanation, no markdown):
{
  "keywords": ["word1", "word2"],
  "category": "exact category name or null",
  "storeSection": "pharmacy|supermarket|cosmetics|null",
  "maxPrice": number or null,
  "interpretation": "one sentence explaining what the user wants"
}`;

    let filters: Record<string, unknown> = {};
    let interpretation = `Showing results for: ${query}`;

    try {
      const raw = await chatCompletion([{ role: 'user', content: interpretPrompt }], {
        temperature: 0.1,
        max_tokens: 200,
      });

      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      interpretation = parsed.interpretation || interpretation;

      // Build MongoDB query from AI interpretation
      const dbQuery: Record<string, unknown> = { status: { $in: ['active', 'out_of_stock'] } };

      if (parsed.keywords?.length) {
        dbQuery.$or = [
          { name: { $regex: parsed.keywords.join('|'), $options: 'i' } },
          { description: { $regex: parsed.keywords.join('|'), $options: 'i' } },
          { tags: { $in: parsed.keywords.map((k: string) => new RegExp(k, 'i')) } },
        ];
      }

      if (parsed.storeSection && parsed.storeSection !== 'null') {
        dbQuery.storeSection = parsed.storeSection;
      }

      if (parsed.category) {
        const cat = categories.find((c) => c.name.toLowerCase() === parsed.category.toLowerCase());
        if (cat) dbQuery.category = cat._id;
      }

      if (parsed.maxPrice) {
        dbQuery.price = { $lte: parsed.maxPrice };
      }

      filters = dbQuery;
    } catch {
      // Fallback to basic text search if AI fails
      filters = {
        status: { $in: ['active', 'out_of_stock'] },
        $text: { $search: query },
      };
    }

    const products = await Product.find(filters)
      .select('name price effectivePrice images status stock category storeSection slug rating')
      .populate('category', 'name')
      .limit(20)
      .lean();

    return { products, interpretation, filters };
  }

  // ─── Product Description Generator (Admin) ─────────────────────────────────
  async generateDescription(productData: {
    name: string;
    category: string;
    price: number;
    storeSection: string;
  }): Promise<string> {
    const prompt = `Write a clear, professional product description for a retail store.

Product: ${productData.name}
Category: ${productData.category}
Section: ${productData.storeSection}
Price: ${productData.price}

Rules:
- 2-3 sentences maximum
- Mention key benefits
- No hype or exaggeration
- Professional retail tone
- Do NOT mention the price in the description

Return only the description text, nothing else.`;

    try {
      return await chatCompletion([{ role: 'user', content: prompt }], {
        temperature: 0.6,
        max_tokens: 150,
      });
    } catch (err) {
      throw new Error('Description generation failed. Please write it manually.');
    }
  }

  // ─── Inventory Insights (Admin) ────────────────────────────────────────────
  async inventoryInsights(): Promise<{
    lowStockProducts: unknown[];
    insights: string;
  }> {
    const lowStock = await Product.find({
      status: { $ne: 'deleted' },
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    })
      .select('name stock lowStockThreshold storeSection category')
      .populate('category', 'name')
      .limit(20)
      .lean();

    if (!lowStock.length) {
      return { lowStockProducts: [], insights: 'All products are adequately stocked.' };
    }

    const productList = lowStock
      .map((p: any) => `${p.name} (${p.stock} units left)`)
      .join(', ');

    const prompt = `A store has these low-stock products: ${productList}. Write 2 short actionable sentences advising the store owner on what to prioritize restocking. Be direct.`;

    let insights = `${lowStock.length} product(s) need restocking.`;
    try {
      insights = await chatCompletion([{ role: 'user', content: prompt }], {
        temperature: 0.4,
        max_tokens: 100,
      });
    } catch { /* fallback to static message */ }

    return { lowStockProducts: lowStock, insights };
  }
}

export default new AIService();
