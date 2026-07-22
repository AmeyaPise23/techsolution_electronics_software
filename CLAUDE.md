# Project Rules

## Stack
- Backend: Java 17, Spring Boot 3.2.3, MySQL 8, Maven (cd backend && mvn)
- Frontend: React 18 + Vite + TypeScript, shadcn/ui, Tailwind CSS
- Backend path: ./backend | Frontend path: ./ (root — src/app/*)

## Hard Rules
- All repository list queries MUST use Pageable — never findAll() then filter in Java
- All service read methods: @Transactional(readOnly = true)
- Money: BigDecimal only. Currency: INR only. Never float/double for money.
- This is a B2B QUOTATION system: stock is VALIDATED at quotation creation,
  DECREMENTED only on quotation→invoice conversion. No cart-level reservation.
- Never modify committed Flyway migrations — always add new versions
- Flyway Java migrations use underscore naming: V3_1__ClassName.java
- All new endpoints must return errors through the @ControllerAdvice ApiResponse format
- Every API contract change MUST include the matching frontend update in the same phase
- Run `cd backend && mvn test` before declaring any backend work done
- Run `npm run build` before declaring any frontend work done
- Do not touch files outside the current phase's scope
