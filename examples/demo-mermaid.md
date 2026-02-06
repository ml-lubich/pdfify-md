---
pdf_options:
  format: a4
  margin: 30mm 25mm
  printBackground: true
  displayHeaderFooter: false
stylesheet:
  - https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.0.0/github-markdown.min.css
body_class: markdown-body
highlight_style: github
---

# 🎨 Mermaid Diagrams Demo

This document showcases the beautiful Mermaid diagrams that can be rendered in PDF format using pdfify-md.

## 📊 Flowchart

A decision-making flowchart:

```mermaid
flowchart TD
    Start([Start]) --> Input[Input Data]
    Input --> Validate{Valid?}
    Validate -->|Yes| Process[Process Data]
    Validate -->|No| Error[Show Error]
    Error --> Input
    Process --> Save[Save to Database]
    Save --> Notify[Send Notification]
    Notify --> End([End])
    
    style Start fill:#90EE90
    style End fill:#90EE90
    style Error fill:#FFB6C1
    style Process fill:#87CEEB
```

## 🔄 Sequence Diagram

Interaction between system components:

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server
    participant Database
    
    User->>Browser: Enter URL
    Browser->>Server: HTTP Request
    Server->>Database: Query Data
    Database-->>Server: Return Results
    Server-->>Browser: HTTP Response
    Browser-->>User: Display Page
    
    Note over User,Database: Complete request cycle
```

## 📅 Gantt Chart

Project timeline visualization:

```mermaid
gantt
    title Project Development Timeline
    dateFormat  YYYY-MM-DD
    section Planning
    Requirements Gathering    :a1, 2024-01-01, 10d
    Design Phase             :a2, after a1, 14d
    section Development
    Backend Development      :b1, after a2, 21d
    Frontend Development     :b2, after a2, 21d
    section Testing
    Unit Tests               :c1, after b1, 7d
    Integration Tests        :c2, after b2, 7d
    section Deployment
    Production Release       :d1, after c1 c2, 3d
```

## 🏗️ Class Diagram

Object-oriented relationships:

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +boolean isIndoor
        +meow()
    }
    class Bird {
        +boolean canFly
        +fly()
    }
    
    Animal <|-- Dog
    Animal <|-- Cat
    Animal <|-- Bird
```

## 🔀 State Diagram

State machine visualization:

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: Start Task
    Processing --> Success: Task Complete
    Processing --> Error: Task Failed
    Success --> Idle: Reset
    Error --> Idle: Reset
    Idle --> [*]: Shutdown
    
    note right of Processing
        This is where the
        main work happens
    end note
```

## 📈 Pie Chart

Data distribution:

```mermaid
pie title Programming Languages Usage
    "JavaScript" : 35
    "Python" : 25
    "Java" : 20
    "TypeScript" : 15
    "Other" : 5
```

## 🌳 Git Graph

Version control visualization:

```mermaid
gitGraph
    commit id: "Initial"
    commit id: "Feature A"
    branch develop
    checkout develop
    commit id: "Dev Work 1"
    commit id: "Dev Work 2"
    checkout main
    commit id: "Hotfix"
    checkout develop
    commit id: "Dev Work 3"
    checkout main
    merge develop
    commit id: "Release"
```

## 🗄️ Entity Relationship Diagram

Database schema:

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--|{ LINE-ITEM : "ordered in"
    CUSTOMER {
        string name
        string email
        int id
    }
    ORDER {
        int id
        date orderDate
        float total
    }
    PRODUCT {
        int id
        string name
        float price
    }
    LINE-ITEM {
        int quantity
        float subtotal
    }
```

## 🎯 User Journey

Customer experience flow:

```mermaid
journey
    title User Shopping Experience
    section Discovery
      Visit Website: 5: User
      Browse Products: 4: User
    section Selection
      Add to Cart: 5: User
      Review Cart: 4: User
    section Purchase
      Checkout: 5: User
      Payment: 3: User, System
      Confirmation: 5: User
```

## 📊 Quadrant Chart

Project prioritization:

```mermaid
quadrantChart
    title Project Prioritization Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Value --> High Value
    quadrant-1 Should Do
    quadrant-2 Must Do
    quadrant-3 Won't Do
    quadrant-4 Nice to Have
    Feature A: [0.2, 0.8]
    Feature B: [0.6, 0.9]
    Feature C: [0.8, 0.3]
    Feature D: [0.3, 0.2]
```

## 🎨 Complex Flowchart

Multi-path decision tree:

```mermaid
flowchart LR
    Start([Start]) --> Input[Input Data]
    Input --> Validate{Valid?}
    Validate -->|No| Error[Show Error]
    Validate -->|Yes| Process[Process Data]
    Error --> Input
    Process --> Save[Save to Database]
    Save --> Notify[Send Notification]
    Notify --> End([End])
    
    style Start fill:#90EE90,stroke:#333,stroke-width:3px
    style End fill:#90EE90,stroke:#333,stroke-width:3px
    style Error fill:#FFB6C1,stroke:#333,stroke-width:2px
    style Process fill:#87CEEB,stroke:#333,stroke-width:2px
    style Save fill:#DDA0DD,stroke:#333,stroke-width:2px
```

## 📝 Conclusion

This document demonstrates the power of Mermaid diagrams in markdown documents. All diagrams are automatically rendered as high-quality images in the PDF output, making your documentation both beautiful and informative.
