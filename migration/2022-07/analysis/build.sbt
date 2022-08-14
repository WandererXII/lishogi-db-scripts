scalaVersion := "2.13.8"
name := "analysis"
organization := "org.lishogi"
version := "1.0"
resolvers += "lila-maven" at "https://raw.githubusercontent.com/ornicar/lila-maven/master"
libraryDependencies += "org.reactivemongo" %% "reactivemongo" % "1.0.10"
libraryDependencies += "org.reactivemongo" %% "reactivemongo-akkastream" % "1.0.10"
libraryDependencies += "com.typesafe.akka" %% "akka-slf4j" % "2.5.32"
libraryDependencies += "ch.qos.logback" % "logback-classic" % "1.2.11"
libraryDependencies += "joda-time" % "joda-time" % "2.10.14"
libraryDependencies ++= List(
  "org.scala-lang.modules" %% "scala-parser-combinators" % "1.1.2",
  "com.github.ornicar"     %% "scalalib"                 % "7.0.2",
  "org.typelevel"          %% "cats-core"                % "2.7.0"
)
scalacOptions ++= Seq(
  "-feature",
  "-language:higherKinds",
  "-language:implicitConversions",
  "-language:postfixOps"
)