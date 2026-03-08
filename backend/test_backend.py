"""Test backend connection"""
import asyncio
import sys

async def test_connection():
    try:
        print("Testing backend imports...")
        from app.main import app
        print("✅ Backend imports successfully!")
        
        print("\nTesting database connection...")
        from app.db.session import async_session
        from sqlalchemy import text
        
        async with async_session() as session:
            result = await session.execute(text("SELECT DATABASE()"))
            db_name = result.scalar()
            print(f"✅ Connected to database: {db_name}")
            
            # Check if tables exist
            result = await session.execute(text("SHOW TABLES"))
            tables = result.fetchall()
            if tables:
                print(f"✅ Found {len(tables)} tables:")
                for table in tables:
                    print(f"   - {table[0]}")
            else:
                print("⚠️  No tables found - need to create them")
                
        return True
    except Exception as e:
        print(f" ❌ Error: {type(e).__name__}: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_connection())
    sys.exit(0 if success else 1)
