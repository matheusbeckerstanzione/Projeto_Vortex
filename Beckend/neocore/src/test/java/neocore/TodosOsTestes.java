package neocore;

import org.junit.platform.suite.api.IncludeClassNamePatterns;
import org.junit.platform.suite.api.SelectPackages;
import org.junit.platform.suite.api.Suite;
import org.junit.platform.suite.api.SuiteDisplayName;

@Suite
@SuiteDisplayName("NeoCore - testes automatizados")
@SelectPackages({
        "neocore.Service",
        "neocore.Controller",
        "neocore.Security",
        "neocore.Integracao",
        "neocore.Client"

})
@IncludeClassNamePatterns(".*Test")
public class TodosOsTestes {
}